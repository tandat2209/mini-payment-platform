import { Body, Controller, HttpCode, HttpStatus, Post, ValidationPipe } from '@nestjs/common';

import { FundingService } from './funding.service';
import { SimulateFundingRequestDto } from './simulate-funding.dto';

type FundingResponse = Awaited<ReturnType<FundingService['simulateFundingWebhook']>>;

const simulateFundingValidationPipe = new ValidationPipe({
  forbidNonWhitelisted: true,
  transform: true,
  whitelist: true,
});

@Controller()
export class FundingController {
  constructor(private readonly fundingService: FundingService) {}

  @Post('simulate/funding')
  @HttpCode(HttpStatus.ACCEPTED)
  async simulateFunding(
    @Body(simulateFundingValidationPipe) body: SimulateFundingRequestDto,
  ): Promise<FundingResponse> {
    return await this.fundingService.simulateFundingWebhook(body);
  }
}
