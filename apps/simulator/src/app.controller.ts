import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';

type SimulatorHealthResponse = ReturnType<AppService['getHealth']>;

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): SimulatorHealthResponse {
    return this.appService.getHealth();
  }
}
