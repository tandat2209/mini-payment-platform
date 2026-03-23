import { Injectable } from '@nestjs/common';

import { ApplyInboundFundingService } from '../../../funding/application/apply-inbound-funding.service';
import {
  type FundingWebhook,
  type RecordedWebhookEvent,
} from '../../../funding/domain/funding.types';

@Injectable()
export class RecordFundingWebhookCommand {
  constructor(private readonly applyInboundFundingService: ApplyInboundFundingService) {}

  execute(payload: FundingWebhook): Promise<RecordedWebhookEvent> {
    return this.applyInboundFundingService.execute(payload);
  }
}
