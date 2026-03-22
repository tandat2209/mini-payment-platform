import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

export interface HealthResponse {
  database: Awaited<ReturnType<DatabaseService['getHealth']>>;
  service: 'api';
  status: 'degraded' | 'ok';
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getHealth(): Promise<HealthResponse> {
    const database = await this.databaseService.getHealth();

    return {
      database,
      service: 'api',
      status: database.status === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
    };
  }
}
