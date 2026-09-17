import test from 'node:test';
import assert from 'node:assert/strict';

test('wbAssets is a dedicated NocoBase file collection', async () => {
  let wbAssets: any;
  try {
    const module = await import('../../server/collections/wbAssets');
    wbAssets = module.default;
  } catch {}

  assert.ok(wbAssets, 'wbAssets collection module must exist');
  assert.equal(wbAssets.name, 'wbAssets');
  assert.equal(wbAssets.template, 'file');
  assert.equal(wbAssets.title, 'Website Builder Assets');
});
