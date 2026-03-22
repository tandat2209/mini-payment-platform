import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class HealthService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getHealth() {
    const database = await this.databaseService.getHealth();

    return {
      database,
      service: 'api',
      status: database.status === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
    };
  }
}
