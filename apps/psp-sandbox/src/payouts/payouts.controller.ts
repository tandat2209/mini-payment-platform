import { Body, Controller, HttpCode, HttpStatus, Post, ValidationPipe } from '@nestjs/common';

import { PayoutsService } from './payouts.service';
import { SimulatePayoutUpdateRequestDto } from './simulate-payout-update.dto';
import { SubmitPayoutRequestDto } from './submit-payout.dto';

type PayoutSubmissionResponse = Awaited<ReturnType<PayoutsService['submitPayout']>>;
type PayoutUpdateResponse = Awaited<ReturnType<PayoutsService['simulatePayoutUpdate']>>;

const payoutSubmissionValidationPipe = new ValidationPipe({
  forbidNonWhitelisted: true,
  transform: true,
  whitelist: true,
});
const payoutUpdateValidationPipe = new ValidationPipe({
  forbidNonWhitelisted: true,
  transform: true,
  whitelist: true,
});

@Controller()
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post('payouts')
  @HttpCode(HttpStatus.ACCEPTED)
  async submitPayout(
    @Body(payoutSubmissionValidationPipe) body: SubmitPayoutRequestDto,
  ): Promise<PayoutSubmissionResponse> {
    return await this.payoutsService.submitPayout(body);
  }

  @Post('simulate/payout-updates')
  @HttpCode(HttpStatus.ACCEPTED)
  async simulatePayoutUpdate(
    @Body(payoutUpdateValidationPipe) body: SimulatePayoutUpdateRequestDto,
  ): Promise<PayoutUpdateResponse> {
    return await this.payoutsService.simulatePayoutUpdate(body);
  }
}
