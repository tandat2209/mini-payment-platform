import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { ApplyReconciliationReportService } from './application/apply-reconciliation-report.service';
import { RecordReconciliationReportCommand } from './application/commands/record-reconciliation-report.command';
import { ReconciliationLineClassifierService } from './application/reconciliation-line-classifier.service';
import { RECONCILIATION_REPORT_STORE } from './domain/reconciliation-report.store';
import { SqlReconciliationReportStore } from './infrastructure/sql-reconciliation-report.store';
import { ReconciliationReportsController } from './presentation/reconciliation-reports.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ReconciliationReportsController],
  providers: [
    ApplyReconciliationReportService,
    RecordReconciliationReportCommand,
    ReconciliationLineClassifierService,
    SqlReconciliationReportStore,
    {
      provide: RECONCILIATION_REPORT_STORE,
      useExisting: SqlReconciliationReportStore,
    },
  ],
})
export class ReconciliationReportsModule {}
