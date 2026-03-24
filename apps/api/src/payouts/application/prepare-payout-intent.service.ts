import { Inject, Injectable } from '@nestjs/common';

import {
  PayoutRecipientRailCurrencyMismatchError,
  PayoutRecipientRailNotFoundError,
  PayoutRecipientRailNotReadyError,
  type PreparedPayoutIntent,
  type PreparePayoutIntentInput,
  ProviderManagedRecipientRailMissingReferenceError,
} from '../domain/payout-preparation.types';
import {
  PAYOUT_RECIPIENT_RAIL_REPOSITORY,
  type PayoutRecipientRailRepository,
} from '../domain/payout-recipient-rail.repository';

@Injectable()
export class PreparePayoutIntentService {
  constructor(
    @Inject(PAYOUT_RECIPIENT_RAIL_REPOSITORY)
    private readonly payoutRecipientRailRepository: PayoutRecipientRailRepository,
  ) {}

  async prepare(input: PreparePayoutIntentInput): Promise<PreparedPayoutIntent> {
    const recipientRail = await this.payoutRecipientRailRepository.findOwnedRecipientRail(
      input.customerId,
      input.recipientRailId,
    );

    if (!recipientRail) {
      throw new PayoutRecipientRailNotFoundError(input.recipientRailId);
    }

    if (recipientRail.recipientStatus !== 'active') {
      throw new PayoutRecipientRailNotReadyError(
        input.recipientRailId,
        `recipient status is ${recipientRail.recipientStatus}`,
      );
    }

    if (!recipientRail.isActive) {
      throw new PayoutRecipientRailNotReadyError(input.recipientRailId, 'rail is inactive');
    }

    if (recipientRail.readinessStatus !== 'active') {
      throw new PayoutRecipientRailNotReadyError(
        input.recipientRailId,
        `readiness status is ${recipientRail.readinessStatus}`,
      );
    }

    const payoutCurrency = input.currency.trim().toUpperCase();

    if (recipientRail.currency && recipientRail.currency !== payoutCurrency) {
      throw new PayoutRecipientRailCurrencyMismatchError(
        input.recipientRailId,
        recipientRail.currency,
        payoutCurrency,
      );
    }

    return {
      amountMinor: input.amountMinor,
      currency: payoutCurrency,
      customerId: input.customerId,
      rail: recipientRail.rail,
      recipientId: recipientRail.recipientId,
      recipientName: recipientRail.recipientName,
      recipientRailId: recipientRail.recipientRailId,
      reference: input.reference ?? null,
      sourceWalletId: input.sourceWalletId,
      submissionTarget:
        recipientRail.providerRegistrationStrategy === 'provider_managed'
          ? this.getProviderReferenceTarget(
              recipientRail.recipientRailId,
              recipientRail.providerReference,
            )
          : {
              details: recipientRail.details,
              mode: 'inline_recipient_details',
            },
    };
  }

  private getProviderReferenceTarget(
    recipientRailId: string,
    providerReference: string | null,
  ): {
    mode: 'provider_reference';
    providerReference: string;
  } {
    if (!providerReference) {
      throw new ProviderManagedRecipientRailMissingReferenceError(recipientRailId);
    }

    return {
      mode: 'provider_reference',
      providerReference,
    };
  }
}
