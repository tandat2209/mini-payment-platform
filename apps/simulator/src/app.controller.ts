import { Body, Controller, Get, HttpCode, HttpStatus, Post, ValidationPipe } from '@nestjs/common';

import { AppService } from './app.service';
import { SimulateFundingRequestDto } from './simulate-funding.dto';

type SimulatorHealthResponse = ReturnType<AppService['getHealth']>;
type SimulatorFundingResponse = Awaited<ReturnType<AppService['simulateFundingWebhook']>>;

const simulateFundingValidationPipe = new ValidationPipe({
  forbidNonWhitelisted: true,
  transform: true,
  whitelist: true,
});

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): SimulatorHealthResponse {
    return this.appService.getHealth();
  }

  @Post('simulate/funding')
  @HttpCode(HttpStatus.ACCEPTED)
  async simulateFunding(
    @Body(simulateFundingValidationPipe) body: SimulateFundingRequestDto,
  ): Promise<SimulatorFundingResponse> {
    return await this.appService.simulateFundingWebhook(body);
  }
}
