import type { WebsiteAsset, WebsiteAssetListOptions, WebsiteAssetPage } from './types';

function optionalString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function normalizeWebsiteAsset(record: any): WebsiteAsset | null {
  if (!record || (typeof record.id !== 'string' && typeof record.id !== 'number')) return null;

  const mimetype = optionalString(record.mimetype);
  const url = optionalString(record.url);
  if (!mimetype?.startsWith('image/') || !url) return null;

  const asset: WebsiteAsset = {
    id: record.id,
    url,
    mimetype,
  };

  const title = optionalString(record.title);
  const filename = optionalString(record.filename);
  const preview = optionalString(record.preview);
  if (title) asset.title = title;
  if (filename) asset.filename = filename;
  if (preview) asset.preview = preview;
  if (typeof record.size === 'number') asset.size = record.size;
  if (record.meta && typeof record.meta === 'object' && !Array.isArray(record.meta)) {
    asset.meta = record.meta as Record<string, unknown>;
  }

  return asset;
}

export async function listWebsiteAssets(
  api: any,
  options: WebsiteAssetListOptions = {},
): Promise<WebsiteAssetPage> {
  const page = Math.max(1, Number(options.page || 1));
  const pageSize = Math.max(1, Number(options.pageSize || 12));
  const search = String(options.search || '').trim();
  const imageFilter = { mimetype: { $startsWith: 'image/' } };
  const filter = search
    ? {
        $and: [
          imageFilter,
          {
            $or: [
              { title: { $includes: search } },
              { filename: { $includes: search } },
            ],
          },
        ],
      }
    : imageFilter;

  const response = await api.resource('wbAssets').list({
    page,
    pageSize,
    sort: ['-createdAt'],
    filter,
  });
  const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
  const items = rows.map(normalizeWebsiteAsset).filter((item): item is WebsiteAsset => Boolean(item));
  const meta = response?.data?.meta || {};

  return {
    items,
    total: Number(meta.count ?? items.length),
    page: Number(meta.page ?? page),
    pageSize: Number(meta.pageSize ?? pageSize),
  };
}
