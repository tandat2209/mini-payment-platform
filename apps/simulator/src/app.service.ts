import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'simulator',
      timestamp: new Date().toISOString(),
    };
  }
}
