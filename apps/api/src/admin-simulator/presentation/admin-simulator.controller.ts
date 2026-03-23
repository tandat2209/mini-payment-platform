import { Body, Controller, HttpCode, HttpStatus, Post, ValidationPipe } from '@nestjs/common';

import { AdminSimulatorService } from '../application/admin-simulator.service';
import { AdminSimulatorFundingRequestDto } from './admin-simulator-funding.dto';

const adminSimulatorValidationPipe = new ValidationPipe({
  forbidNonWhitelisted: true,
  transform: true,
  whitelist: true,
});

type AdminSimulatorFundingResponse = Awaited<ReturnType<AdminSimulatorService['simulateFunding']>>;

@Controller('admin/simulator')
export class AdminSimulatorController {
  constructor(private readonly adminSimulatorService: AdminSimulatorService) {}

  @Post('funding')
  @HttpCode(HttpStatus.ACCEPTED)
  async simulateFunding(
    @Body(adminSimulatorValidationPipe) body: AdminSimulatorFundingRequestDto,
  ): Promise<AdminSimulatorFundingResponse> {
    return await this.adminSimulatorService.simulateFunding(body.toDomain());
  }
}
