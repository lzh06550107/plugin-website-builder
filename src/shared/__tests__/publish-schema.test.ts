import test from 'node:test';
import assert from 'node:assert/strict';
import { createPageRoot } from '../schema';
import { assertValidWebsiteSchema, nextPageVersion } from '../../server/services/schema';

test('valid schema can pass publish validation', () => {
  const schema = createPageRoot('root');
  assert.equal(assertValidWebsiteSchema(schema), schema);
});

test('invalid schema is rejected before publish', () => {
  const schema = { ...createPageRoot('root'), type: 'page' };
  assert.throws(() => assertValidWebsiteSchema(schema), /Invalid Website Schema/);
});

test('next published version increments monotonically', () => {
  assert.equal(nextPageVersion(undefined), 1);
  assert.equal(nextPageVersion(4), 5);
});
