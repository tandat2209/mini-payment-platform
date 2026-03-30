import { Body, Controller, HttpCode, HttpStatus, Post, ValidationPipe } from '@nestjs/common';

import { ReconciliationService } from './reconciliation.service';
import { SimulateReconciliationReportRequestDto } from './simulate-reconciliation-report.dto';

type ReconciliationReportResponse = Awaited<
  ReturnType<ReconciliationService['simulateDailyReport']>
>;

const reconciliationValidationPipe = new ValidationPipe({
  forbidNonWhitelisted: true,
  transform: true,
  whitelist: true,
});

@Controller()
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Post('simulate/reconciliation-reports')
  @HttpCode(HttpStatus.ACCEPTED)
  async simulateReconciliationReport(
    @Body(reconciliationValidationPipe) body: SimulateReconciliationReportRequestDto,
  ): Promise<ReconciliationReportResponse> {
    return await this.reconciliationService.simulateDailyReport(body);
  }
}
