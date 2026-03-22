import { Injectable } from '@nestjs/common';

interface SimulatorHealthResponse {
  service: 'simulator';
  status: 'ok';
  timestamp: string;
}

@Injectable()
export class AppService {
  getHealth(): SimulatorHealthResponse {
    return {
      status: 'ok',
      service: 'simulator',
      timestamp: new Date().toISOString(),
    };
  }
}
