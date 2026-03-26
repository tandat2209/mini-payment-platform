import assert from 'node:assert/strict';
import test from 'node:test';

import { AppService } from './app.service';

test('getHealth includes database health from the database service', async () => {
  const service = new AppService({
    getHealth: async () => ({
      configured: true,
      database: 'payment_platform_mini',
      status: 'ok',
    }),
  } as never);

  const result = await service.getHealth();

  assert.equal(result.service, 'psp-sandbox');
  assert.equal(result.status, 'ok');
  assert.equal(result.database.status, 'ok');
  assert.equal(result.database.configured, true);
});
