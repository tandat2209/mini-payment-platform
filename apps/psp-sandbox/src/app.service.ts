import { Injectable } from '@nestjs/common';

import { DatabaseService } from './database/database.service';

type PspSandboxHealthResponse = {
  database: Awaited<ReturnType<DatabaseService['getHealth']>>;
  service: 'psp-sandbox';
  status: 'ok';
  timestamp: string;
};

@Injectable()
export class AppService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getHealth(): Promise<PspSandboxHealthResponse> {
    return {
      database: await this.databaseService.getHealth(),
      service: 'psp-sandbox',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

export type { PspSandboxHealthResponse };
