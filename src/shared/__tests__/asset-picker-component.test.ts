import test from 'node:test';
import assert from 'node:assert/strict';

test('WebsiteAssetPicker is available to the editor', async () => {
  let module: any;
  try {
    module = await import('../../client/editor/assets/WebsiteAssetPicker');
  } catch {}
  assert.equal(typeof module?.WebsiteAssetPicker, 'function', 'WebsiteAssetPicker must exist');
});
