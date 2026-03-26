import { Body, Controller, HttpCode, HttpStatus, Post, ValidationPipe } from '@nestjs/common';

import { BeneficiariesService } from './beneficiaries.service';
import { RegisterBeneficiaryRequestDto } from './register-beneficiary.dto';

type BeneficiaryResponse = Awaited<ReturnType<BeneficiariesService['registerBeneficiary']>>;

const beneficiaryValidationPipe = new ValidationPipe({
  forbidNonWhitelisted: true,
  transform: true,
  whitelist: true,
});

@Controller()
export class BeneficiariesController {
  constructor(private readonly beneficiariesService: BeneficiariesService) {}

  @Post('beneficiaries')
  @HttpCode(HttpStatus.CREATED)
  async registerBeneficiary(
    @Body(beneficiaryValidationPipe) body: RegisterBeneficiaryRequestDto,
  ): Promise<BeneficiaryResponse> {
    return await this.beneficiariesService.registerBeneficiary(body);
  }
}
