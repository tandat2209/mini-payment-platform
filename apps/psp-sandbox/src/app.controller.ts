import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';

type PspSandboxHealthResponse = Awaited<ReturnType<AppService['getHealth']>>;

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  async getHealth(): Promise<PspSandboxHealthResponse> {
    return await this.appService.getHealth();
  }
}
