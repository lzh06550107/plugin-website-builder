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

test('website asset file authorizer is narrowly scoped', async () => {
  let isWebsiteAssetFileAccess: any;
  try {
    isWebsiteAssetFileAccess = (await import('../../server/assets/fileAccess')).isWebsiteAssetFileAccess;
  } catch {}

  assert.equal(typeof isWebsiteAssetFileAccess, 'function', 'file access helper must exist');
  assert.equal(isWebsiteAssetFileAccess({ dataSourceKey: 'main', collectionName: 'wbAssets' }), true);
  assert.equal(isWebsiteAssetFileAccess({ dataSourceKey: 'main', collectionName: 'attachments' }), false);
  assert.equal(isWebsiteAssetFileAccess({ dataSourceKey: 'another', collectionName: 'wbAssets' }), false);
});

test('asset management actions stay private while published page data remains public', async () => {
  const acl: any = await import('../../server/acl');
  assert.equal(typeof acl.getWebsiteBuilderAclDefinitions, 'function', 'ACL definitions helper must exist');

  const defs = acl.getWebsiteBuilderAclDefinitions();
  const view = defs.find((item: any) => item.name === acl.WEBSITE_BUILDER_VIEW_SNIPPET);
  const edit = defs.find((item: any) => item.name === acl.WEBSITE_BUILDER_EDIT_SNIPPET);

  assert.ok(view.actions.includes('wbAssets:list'));
  assert.ok(view.actions.includes('wbAssets:get'));
  assert.ok(edit.actions.includes('wbAssets:create'));
  assert.equal(view.actions.includes('wbAssets:create'), false);

  const publicAllows: any[] = [];
  acl.registerWebsiteBuilderAcl({
    acl: {
      registerSnippet() {},
      allow(...args: any[]) {
        publicAllows.push(args);
      },
    },
  });

  assert.deepEqual(publicAllows, [['websiteBuilder', 'getPublishedByPath', 'public']]);
});
