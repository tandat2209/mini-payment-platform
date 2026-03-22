import { Controller, Get } from '@nestjs/common';

import { type HealthResponse, HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth(): Promise<HealthResponse> {
    return await this.healthService.getHealth();
  }
}
