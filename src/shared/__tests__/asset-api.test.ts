import test from 'node:test';
import assert from 'node:assert/strict';

async function loadAssetApi() {
  let module: any;
  try {
    module = await import('../../client/editor/assets/assetApi');
  } catch {}
  assert.equal(typeof module?.normalizeWebsiteAsset, 'function', 'normalizeWebsiteAsset must exist');
  assert.equal(typeof module?.listWebsiteAssets, 'function', 'listWebsiteAssets must exist');
  return module;
}

test('normalizeWebsiteAsset accepts image records with a stable URL', async () => {
  const { normalizeWebsiteAsset } = await loadAssetApi();
  assert.deepEqual(
    normalizeWebsiteAsset({
      id: 1,
      title: 'Hero',
      filename: 'hero.png',
      mimetype: 'image/png',
      url: '/files/hero.png',
      preview: '/files/hero.png?preview=1',
      size: 1024,
      meta: { width: 1600 },
    }),
    {
      id: 1,
      title: 'Hero',
      filename: 'hero.png',
      mimetype: 'image/png',
      url: '/files/hero.png',
      preview: '/files/hero.png?preview=1',
      size: 1024,
      meta: { width: 1600 },
    },
  );
});

test('normalizeWebsiteAsset rejects non-images and records without a URL', async () => {
  const { normalizeWebsiteAsset } = await loadAssetApi();
  assert.equal(normalizeWebsiteAsset({ id: 2, mimetype: 'application/pdf', url: '/a.pdf' }), null);
  assert.equal(normalizeWebsiteAsset({ id: 3, mimetype: 'image/png' }), null);
  assert.equal(normalizeWebsiteAsset({ id: 4, url: '/unknown' }), null);
});

test('same-origin uploaded URLs become portable paths while external CDN URLs stay absolute', async () => {
  const { toPortableWebsiteAssetUrl } = await loadAssetApi();
  assert.equal(typeof toPortableWebsiteAssetUrl, 'function');
  assert.equal(
    toPortableWebsiteAssetUrl('https://cms.example.com/nocobase/files/a.png?preview=1', 'https://cms.example.com'),
    '/nocobase/files/a.png?preview=1',
  );
  assert.equal(
    toPortableWebsiteAssetUrl('https://cdn.example.com/a.png', 'https://cms.example.com'),
    'https://cdn.example.com/a.png',
  );
  assert.equal(toPortableWebsiteAssetUrl('/files/a.png', 'https://cms.example.com'), '/files/a.png');
});

test('listWebsiteAssets queries wbAssets with image filtering, search, pagination and newest-first sorting', async () => {
  const { listWebsiteAssets } = await loadAssetApi();
  let params: any;
  const api = {
    resource(name: string) {
      assert.equal(name, 'wbAssets');
      return {
        async list(next: any) {
          params = next;
          return {
            data: {
              data: [
                { id: 1, title: 'Hero', filename: 'hero.png', mimetype: 'image/png', url: '/1.png' },
                { id: 2, title: 'PDF', filename: 'a.pdf', mimetype: 'application/pdf', url: '/a.pdf' },
              ],
              meta: { count: 25, page: 2, pageSize: 12 },
            },
          };
        },
      };
    },
  };

  const result = await listWebsiteAssets(api, { page: 2, pageSize: 12, search: 'hero' });

  assert.equal(params.page, 2);
  assert.equal(params.pageSize, 12);
  assert.deepEqual(params.sort, ['-createdAt']);
  assert.deepEqual(params.filter, {
    $and: [
      { mimetype: { $startsWith: 'image/' } },
      {
        $or: [
          { title: { $includes: 'hero' } },
          { filename: { $includes: 'hero' } },
        ],
      },
    ],
  });
  assert.deepEqual(result.items.map((item: any) => item.id), [1]);
  assert.equal(result.total, 25);
  assert.equal(result.page, 2);
  assert.equal(result.pageSize, 12);
});

test('listWebsiteAssets omits the search OR filter for an empty search string', async () => {
  const { listWebsiteAssets } = await loadAssetApi();
  let params: any;
  const api = {
    resource() {
      return {
        async list(next: any) {
          params = next;
          return { data: { data: [], meta: {} } };
        },
      };
    },
  };

  await listWebsiteAssets(api, { search: '   ' });
  assert.deepEqual(params.filter, { mimetype: { $startsWith: 'image/' } });
});
