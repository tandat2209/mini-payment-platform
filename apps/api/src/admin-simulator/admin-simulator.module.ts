import { Module } from '@nestjs/common';

import { AdminSimulatorService } from './application/admin-simulator.service';
import { AdminSimulatorController } from './presentation/admin-simulator.controller';

@Module({
  controllers: [AdminSimulatorController],
  providers: [AdminSimulatorService],
})
export class AdminSimulatorModule {}
