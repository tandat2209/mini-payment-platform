import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';

import { toIsoTimestamp, toMoneyDto } from '../../../shared/api/api-primitives';
import {
  decodeTransactionCursor,
  parseCurrency,
  parseLimit,
  parseOptionalDate,
} from '../../../shared/api/cursor';
import { GetAdminTransactionsQuery } from '../../application/queries/get-admin-transactions.query';
import {
  type AdminTransactionDetailView,
  type AdminTransactionListItemView,
} from '../../domain/admin-transaction-query.repository';

type AdminTransactionResponse = {
  amounts: {
    fee: ReturnType<typeof toMoneyDto>;
    gross: ReturnType<typeof toMoneyDto>;
    net: ReturnType<typeof toMoneyDto>;
  };
  currency: string;
  customer: {
    externalRef: string;
    id: string;
  };
  description: string;
  direction: string;
  id: string;
  occurredAt: string | null;
  postedAt: string | null;
  reference: string | null;
  status: string;
  type: string;
  walletId: string;
  webhookEventId: string | null;
};

type AdminTransactionDetailResponse = AdminTransactionResponse & {
  linkedLedgers: Array<{
    description: string | null;
    id: string;
    postedAt: string | null;
    reference: string | null;
    status: string;
    transactionType: string;
  }>;
  payout: {
    payoutId: string;
    payoutReference: string | null;
    recipientId: string | null;
    recipientName: string | null;
    returnedAmount: ReturnType<typeof toMoneyDto> | null;
    returnedAt: string | null;
    status: string;
    walletRestoredAmount: ReturnType<typeof toMoneyDto> | null;
  } | null;
};

@Controller('admin/transactions')
export class AdminTransactionsController {
  constructor(private readonly getAdminTransactionsQuery: GetAdminTransactionsQuery) {}

  @Get()
  async listTransactions(
    @Query('cursor') rawCursor?: string,
    @Query('currency') rawCurrency?: string,
    @Query('dateFrom') rawDateFrom?: string,
    @Query('dateTo') rawDateTo?: string,
    @Query('limit') rawLimit?: string,
    @Query('query') rawQuery?: string,
    @Query('status') rawStatus?: string,
    @Query('type') rawType?: string,
  ): Promise<{
    items: AdminTransactionResponse[];
    page: { limit: number; nextCursor: string | null };
  }> {
    const limit = parseLimit(rawLimit);
    const result = await this.getAdminTransactionsQuery.list({
      currency: parseCurrency(rawCurrency),
      cursor: decodeTransactionCursor(rawCursor),
      dateFrom: parseOptionalDate(rawDateFrom, 'dateFrom'),
      dateTo: parseOptionalDate(rawDateTo, 'dateTo'),
      limit,
      query: rawQuery?.trim() || null,
      status: rawStatus?.trim() || null,
      type: rawType?.trim() || null,
    });

    return {
      items: result.items.map((item) => this.toTransactionResponse(item)),
      page: {
        limit,
        nextCursor: result.nextCursor,
      },
    };
  }

  @Get(':transactionId')
  async getTransactionDetail(
    @Param('transactionId') transactionId: string,
  ): Promise<AdminTransactionDetailResponse> {
    const transaction = await this.getAdminTransactionsQuery.getDetail(transactionId);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      linkedLedgers: transaction.linkedLedgerTransactions.map((ledgerTransaction) => ({
        description: ledgerTransaction.description,
        id: ledgerTransaction.id,
        postedAt: toIsoTimestamp(ledgerTransaction.postedAt),
        reference: ledgerTransaction.reference,
        status: ledgerTransaction.status,
        transactionType: ledgerTransaction.transactionType,
      })),
      ...this.toTransactionResponse(transaction),
      payout: transaction.payoutContext
        ? {
            payoutId: transaction.payoutContext.payoutId,
            payoutReference: transaction.payoutContext.payoutReference,
            recipientId: transaction.payoutContext.recipientId,
            recipientName: transaction.payoutContext.recipientName,
            returnedAmount: transaction.payoutContext.returnedAmountMinor
              ? toMoneyDto(transaction.currency, transaction.payoutContext.returnedAmountMinor)
              : null,
            returnedAt: toIsoTimestamp(transaction.payoutContext.returnedAt),
            status: transaction.payoutContext.status,
            walletRestoredAmount: transaction.payoutContext.walletRestoredAmountMinor
              ? toMoneyDto(
                  transaction.currency,
                  transaction.payoutContext.walletRestoredAmountMinor,
                )
              : null,
          }
        : null,
    };
  }

  private toTransactionResponse(
    transaction: AdminTransactionListItemView | AdminTransactionDetailView,
  ): AdminTransactionResponse {
    return {
      amounts: {
        fee: toMoneyDto(transaction.currency, transaction.feeAmountMinor),
        gross: toMoneyDto(transaction.currency, transaction.grossAmountMinor),
        net: toMoneyDto(transaction.currency, transaction.netAmountMinor),
      },
      currency: transaction.currency,
      customer: {
        externalRef: transaction.customerExternalRef,
        id: transaction.customerId,
      },
      description: transaction.description,
      direction: transaction.direction,
      id: transaction.id,
      occurredAt: toIsoTimestamp(transaction.occurredAt),
      postedAt: toIsoTimestamp(transaction.postedAt),
      reference: transaction.reference,
      status: transaction.status,
      type: transaction.type,
      walletId: transaction.walletId,
      webhookEventId: transaction.webhookEventId,
    };
  }
}
