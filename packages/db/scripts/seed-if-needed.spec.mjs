import assert from 'node:assert/strict';
import test from 'node:test';

import { hasDeterministicSeedData } from './seed-if-needed.mjs';

test('detects when deterministic seed data already exists', async () => {
  const database = {
    async query(sql, parameters) {
      assert.match(sql, /FROM users/u);
      assert.deepEqual(parameters, ['11111111-1111-1111-1111-111111111111']);

      return { rowCount: 1, rows: [{ id: parameters[0] }] };
    },
  };

  assert.equal(await hasDeterministicSeedData(database), true);
});

test('detects when deterministic seed data is absent', async () => {
  const database = {
    async query() {
      return { rowCount: 0, rows: [] };
    },
  };

  assert.equal(await hasDeterministicSeedData(database), false);
});
