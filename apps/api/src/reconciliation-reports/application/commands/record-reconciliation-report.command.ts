import { Injectable } from '@nestjs/common';

import {
  type ReconciliationReportWebhook,
  type RecordedReconciliationReportEvent,
} from '../../domain/reconciliation-report.types';
import { ApplyReconciliationReportService } from '../apply-reconciliation-report.service';

@Injectable()
export class RecordReconciliationReportCommand {
  constructor(
    private readonly applyReconciliationReportService: ApplyReconciliationReportService,
  ) {}

  execute(payload: ReconciliationReportWebhook): Promise<RecordedReconciliationReportEvent> {
    return this.applyReconciliationReportService.execute(payload);
  }
}
