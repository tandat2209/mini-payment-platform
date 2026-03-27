import { createHash, randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { LedgerAccountService } from '../../ledger/application/ledger-account.service';
import { LedgerPostingService } from '../../ledger/application/ledger-posting.service';
import {
  TRANSACTION_MANAGER,
  type TransactionManager,
} from '../../shared/application/transaction-manager';
import { toStructuredLog } from '../../shared/logging/structured-log';
import {
  PAYOUT_IDEMPOTENCY_REPOSITORY,
  type PayoutIdempotencyRepository,
} from '../domain/payout-idempotency.repository';
import { type PreparedPayoutIntent } from '../domain/payout-preparation.types';
import {
  PAYOUT_SUBMISSION_GATEWAY,
  type PayoutSubmissionGateway,
} from '../domain/payout-submission.gateway';
import {
  PAYOUT_WALLET_REPOSITORY,
  PAYOUT_WRITE_REPOSITORY,
  type PayoutWalletRepository,
  type PayoutWriteRepository,
} from '../domain/payout-write.repositories';
import {
  type CreatedPayout,
  type CreatePayoutInput,
  InsufficientWalletBalanceError,
  PayoutIdempotencyConflictError,
  PayoutSourceWalletNotFoundError,
} from '../domain/payout-write.types';
import { PreparePayoutIntentService } from './prepare-payout-intent.service';

const PAYOUT_FEE_BASIS_POINTS = 10;

@Injectable()
export class ExecutePayoutService {
  private readonly logger = new Logger(ExecutePayoutService.name);

  constructor(
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManager,
    private readonly preparePayoutIntentService: PreparePayoutIntentService,
    @Inject(PAYOUT_IDEMPOTENCY_REPOSITORY)
    private readonly payoutIdempotencyRepository: PayoutIdempotencyRepository,
    @Inject(PAYOUT_SUBMISSION_GATEWAY)
    private readonly payoutSubmissionGateway: PayoutSubmissionGateway,
    @Inject(PAYOUT_WALLET_REPOSITORY)
    private readonly payoutWalletRepository: PayoutWalletRepository,
    @Inject(PAYOUT_WRITE_REPOSITORY)
    private readonly payoutWriteRepository: PayoutWriteRepository,
    private readonly ledgerAccountService: LedgerAccountService,
    private readonly ledgerPostingService: LedgerPostingService,
  ) {}

  async execute(input: CreatePayoutInput): Promise<CreatedPayout> {
    const payoutIntent = await this.preparePayoutIntentService.prepare({
      amountMinor: input.amountMinor,
      currency: input.sourceCurrency,
      customerId: input.customerId,
      recipientRailId: input.recipientRailId,
      sourceWalletId: input.sourceWalletId,
      ...(input.reference === undefined ? {} : { reference: input.reference }),
    });
    const feeAmountMinor = calculatePayoutFeeAmountMinor(payoutIntent.amountMinor);
    const grossAmountMinor = payoutIntent.amountMinor + feeAmountMinor;

    this.logger.log(
      toStructuredLog({
        amountMinor: payoutIntent.amountMinor,
        currency: payoutIntent.currency,
        event: 'payout_execution_started',
        feeAmountMinor,
        grossAmountMinor,
        recipientId: payoutIntent.recipientId,
        recipientRailId: payoutIntent.recipientRailId,
        sourceWalletId: payoutIntent.sourceWalletId,
        userId: payoutIntent.customerId,
      }),
    );

    return await this.transactionManager.runInTransaction(async (context) => {
      const now = new Date().toISOString();
      const requestFingerprint = buildIdempotencyRequestFingerprint(
        input,
        payoutIntent.amountMinor,
      );
      let idempotencyKeyId: string | null = null;

      const idempotencyKey = input.idempotencyKey.trim();
      const idempotencyRecord = await this.payoutIdempotencyRepository.claimKey(context, {
        createdAt: now,
        key: idempotencyKey,
        requestFingerprint,
        scope: 'payout:create',
      });

      if (idempotencyRecord.result === 'existing') {
        if (
          idempotencyRecord.requestFingerprint !== null &&
          idempotencyRecord.requestFingerprint !== requestFingerprint
        ) {
          throw new PayoutIdempotencyConflictError(
            'Idempotency key was already used with a different payout request',
          );
        }

        if (idempotencyRecord.status === 'completed' && idempotencyRecord.responsePayload) {
          this.logger.log(
            toStructuredLog({
              event: 'payout_idempotent_replay',
              idempotencyKey,
              payoutId: idempotencyRecord.responsePayload.payoutId,
              transactionId: idempotencyRecord.responsePayload.transactionId,
              userId: payoutIntent.customerId,
            }),
          );

          return idempotencyRecord.responsePayload;
        }

        throw new PayoutIdempotencyConflictError(
          `Idempotency key is already reserved with status ${idempotencyRecord.status}`,
        );
      }

      idempotencyKeyId = idempotencyRecord.id;

      const walletBalance = await this.payoutWalletRepository.findOwnedActiveWalletBalance(
        context,
        {
          currency: payoutIntent.currency,
          customerId: payoutIntent.customerId,
          walletId: payoutIntent.sourceWalletId,
        },
      );

      if (!walletBalance) {
        throw new PayoutSourceWalletNotFoundError(
          payoutIntent.sourceWalletId,
          payoutIntent.currency,
        );
      }

      if (walletBalance.availableAmountMinor < grossAmountMinor) {
        throw new InsufficientWalletBalanceError(
          payoutIntent.sourceWalletId,
          payoutIntent.currency,
          grossAmountMinor,
        );
      }

      const payoutId = randomUUID();
      const payoutAttemptId = randomUUID();
      const userTransactionId = randomUUID();
      const reference = buildPayoutReference();

      const debited = await this.payoutWalletRepository.debitAvailableBalance(context, {
        amountMinor: grossAmountMinor,
        currency: payoutIntent.currency,
        updatedAt: now,
        walletId: payoutIntent.sourceWalletId,
      });

      if (!debited) {
        throw new InsufficientWalletBalanceError(
          payoutIntent.sourceWalletId,
          payoutIntent.currency,
          grossAmountMinor,
        );
      }

      const walletLedgerAccountId = await this.ledgerAccountService.ensureWalletLiabilityAccount(
        context,
        payoutIntent.sourceWalletId,
        payoutIntent.currency,
        now,
      );
      const recipientPayableAccountId =
        await this.ledgerAccountService.ensureRecipientPayableAccount(
          context,
          payoutIntent.recipientId,
          payoutIntent.currency,
          now,
        );
      const platformRevenueAccountId = await this.ledgerAccountService.ensurePlatformRevenueAccount(
        context,
        payoutIntent.currency,
        now,
      );
      const description = buildPayoutTransactionDescription(
        payoutIntent.recipientName,
        payoutIntent.reference,
      );

      await this.payoutWriteRepository.createPayoutBooking(context, {
        createdAt: now,
        currency: payoutIntent.currency,
        description,
        feeAmountMinor,
        grossAmountMinor,
        netAmountMinor: payoutIntent.amountMinor,
        occurredAt: now,
        payoutId,
        rail: payoutIntent.rail,
        recipientId: payoutIntent.recipientId,
        recipientRailId: payoutIntent.recipientRailId,
        reference,
        ...(idempotencyKeyId === null ? {} : { idempotencyKeyId }),
        userId: payoutIntent.customerId,
        userTransactionId,
        walletId: payoutIntent.sourceWalletId,
      });

      const providerSubmission = await this.payoutSubmissionGateway.submitPayout({
        amountMinor: payoutIntent.amountMinor,
        currency: payoutIntent.currency,
        payoutId,
        payoutReference: reference,
        preparedIntent: payoutIntent,
      });

      await this.payoutWriteRepository.recordSubmissionAttempt(context, {
        attemptId: payoutAttemptId,
        externalPayoutId: providerSubmission.externalPayoutId,
        externalRequestId: providerSubmission.externalRequestId,
        ...(idempotencyKeyId === null ? {} : { idempotencyKeyId }),
        payoutId,
        provider: providerSubmission.provider,
        requestPayload: buildSubmissionRequestPayload(
          payoutIntent,
          payoutIntent.amountMinor,
          reference,
        ),
        responsePayload: providerSubmission.rawResponse,
        status: providerSubmission.providerStatus,
        submittedAt: providerSubmission.acceptedAt,
      });

      await this.payoutWriteRepository.updatePayoutAfterSubmission(context, {
        payoutId,
        status: 'submitted',
        submittedAt: providerSubmission.acceptedAt,
        updatedAt: providerSubmission.acceptedAt,
      });

      await this.ledgerPostingService.createPostedTransaction(context, {
        currency: payoutIntent.currency,
        description: buildLedgerDescription(payoutIntent.recipientName, payoutIntent.reference),
        entries: [
          {
            amountMinor: grossAmountMinor,
            currency: payoutIntent.currency,
            description: 'Wallet debited for payout request',
            direction: 'debit',
            ledgerAccountId: walletLedgerAccountId,
          },
          {
            amountMinor: payoutIntent.amountMinor,
            currency: payoutIntent.currency,
            description: 'Recipient payable booked',
            direction: 'credit',
            ledgerAccountId: recipientPayableAccountId,
          },
          {
            amountMinor: feeAmountMinor,
            currency: payoutIntent.currency,
            description: 'Platform revenue recognized on payout booking',
            direction: 'credit',
            ledgerAccountId: platformRevenueAccountId,
          },
        ],
        postedAt: now,
        reference,
        transactionType: 'payout',
        userTransactionId,
      });

      this.logger.log(
        toStructuredLog({
          amountMinor: payoutIntent.amountMinor,
          currency: payoutIntent.currency,
          event: 'payout_execution_booked',
          feeAmountMinor,
          grossAmountMinor,
          externalPayoutId: providerSubmission.externalPayoutId,
          externalRequestId: providerSubmission.externalRequestId,
          payoutId,
          recipientId: payoutIntent.recipientId,
          recipientRailId: payoutIntent.recipientRailId,
          reference,
          sourceWalletId: payoutIntent.sourceWalletId,
          userId: payoutIntent.customerId,
          userTransactionId,
        }),
      );

      const result: CreatedPayout = {
        amounts: {
          feeAmountMinor: String(feeAmountMinor),
          grossAmountMinor: String(grossAmountMinor),
          netAmountMinor: String(payoutIntent.amountMinor),
        },
        createdAt: now,
        currency: payoutIntent.currency,
        payoutId,
        recipient: {
          id: payoutIntent.recipientId,
          name: payoutIntent.recipientName,
          rail: payoutIntent.rail,
          railId: payoutIntent.recipientRailId,
        },
        reference,
        status: 'submitted',
        transactionId: userTransactionId,
        walletId: payoutIntent.sourceWalletId,
      };

      if (idempotencyKeyId !== null) {
        await this.payoutIdempotencyRepository.markCompleted(context, {
          id: idempotencyKeyId,
          responsePayload: result,
          updatedAt: now,
        });
      }

      return result;
    });
  }
}

function calculatePayoutFeeAmountMinor(netAmountMinor: number): number {
  return Math.ceil((netAmountMinor * PAYOUT_FEE_BASIS_POINTS) / 10_000);
}

function buildPayoutReference(): string {
  return `payout-${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function buildIdempotencyRequestFingerprint(
  input: CreatePayoutInput,
  netAmountMinor: number,
): string {
  const normalizedRequest = {
    amountMinor: netAmountMinor,
    customerId: input.customerId,
    recipientRailId: input.recipientRailId,
    reference: input.reference?.trim() || null,
    sourceCurrency: input.sourceCurrency.trim().toUpperCase(),
    sourceWalletId: input.sourceWalletId,
  };

  return `sha256:${createHash('sha256').update(JSON.stringify(normalizedRequest)).digest('hex')}`;
}

function buildPayoutTransactionDescription(
  recipientName: string,
  reference: string | null,
): string {
  const trimmedReference = reference?.trim();

  if (trimmedReference) {
    return `Payout to ${recipientName}: ${trimmedReference}`;
  }

  return `Payout to ${recipientName}`;
}

function buildLedgerDescription(recipientName: string, reference: string | null): string {
  const trimmedReference = reference?.trim();

  if (trimmedReference) {
    return `Book payout request for ${recipientName} (${trimmedReference})`;
  }

  return `Book payout request for ${recipientName}`;
}

function buildSubmissionRequestPayload(
  payoutIntent: PreparedPayoutIntent,
  amountMinor: number,
  payoutReference: string,
): Record<string, unknown> {
  return {
    amountMinor,
    currency: payoutIntent.currency,
    payoutReference,
    recipient: {
      countryCode: getSubmissionCountryCode(payoutIntent),
      name: payoutIntent.recipientName,
      rail: payoutIntent.rail,
    },
    submissionTarget:
      payoutIntent.submissionTarget.mode === 'provider_reference'
        ? {
            beneficiaryId: payoutIntent.submissionTarget.providerReference,
            mode: 'provider_beneficiary',
          }
        : {
            details: payoutIntent.submissionTarget.details,
            mode: 'inline_details',
          },
  };
}

function getSubmissionCountryCode(payoutIntent: PreparedPayoutIntent): string {
  const candidate =
    payoutIntent.submissionTarget.mode === 'inline_recipient_details'
      ? payoutIntent.submissionTarget.details.countryCode
      : undefined;

  if (typeof candidate === 'string' && /^[A-Z]{2}$/u.test(candidate)) {
    return candidate;
  }

  return 'US';
}
