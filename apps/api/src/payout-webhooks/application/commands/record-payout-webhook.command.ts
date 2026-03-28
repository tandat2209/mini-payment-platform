import { Injectable } from '@nestjs/common';

import { ApplyPayoutWebhookService } from '../../../payouts/application/apply-payout-webhook.service';
import {
  type PayoutWebhook,
  type RecordedPayoutWebhookEvent,
} from '../../../payouts/domain/payout-webhook.types';

@Injectable()
export class RecordPayoutWebhookCommand {
  constructor(private readonly applyPayoutWebhookService: ApplyPayoutWebhookService) {}

  execute(payload: PayoutWebhook): Promise<RecordedPayoutWebhookEvent> {
    return this.applyPayoutWebhookService.execute(payload);
  }
}
