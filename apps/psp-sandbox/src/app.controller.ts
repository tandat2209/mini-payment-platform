import { Body, Controller, Get, HttpCode, HttpStatus, Post, ValidationPipe } from '@nestjs/common';

import { AppService } from './app.service';
import { RegisterBeneficiaryRequestDto } from './register-beneficiary.dto';
import { SimulateFundingRequestDto } from './simulate-funding.dto';

type PspSandboxHealthResponse = ReturnType<AppService['getHealth']>;
type PspSandboxBeneficiaryResponse = Awaited<ReturnType<AppService['registerBeneficiary']>>;
type PspSandboxFundingResponse = Awaited<ReturnType<AppService['simulateFundingWebhook']>>;

const simulateFundingValidationPipe = new ValidationPipe({
  forbidNonWhitelisted: true,
  transform: true,
  whitelist: true,
});
const beneficiaryValidationPipe = new ValidationPipe({
  forbidNonWhitelisted: true,
  transform: true,
  whitelist: true,
});

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): PspSandboxHealthResponse {
    return this.appService.getHealth();
  }

  @Post('simulate/funding')
  @HttpCode(HttpStatus.ACCEPTED)
  async simulateFunding(
    @Body(simulateFundingValidationPipe) body: SimulateFundingRequestDto,
  ): Promise<PspSandboxFundingResponse> {
    return await this.appService.simulateFundingWebhook(body);
  }

  @Post('beneficiaries')
  @HttpCode(HttpStatus.CREATED)
  async registerBeneficiary(
    @Body(beneficiaryValidationPipe) body: RegisterBeneficiaryRequestDto,
  ): Promise<PspSandboxBeneficiaryResponse> {
    return await this.appService.registerBeneficiary(body);
  }
}
