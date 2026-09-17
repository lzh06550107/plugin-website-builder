import type { WebsiteAsset, WebsiteAssetListOptions, WebsiteAssetPage } from './types';

function optionalString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function toPortableWebsiteAssetUrl(value: unknown, origin?: string) {
  const url = optionalString(value);
  if (!url) return '';
  if (!origin || !/^https?:\/\//i.test(url)) return url;

  try {
    const parsed = new URL(url);
    const base = new URL(origin);
    if (parsed.origin === base.origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return url;
  }

  return url;
}

export function normalizeWebsiteAsset(record: any): WebsiteAsset | null {
  if (!record || (typeof record.id !== 'string' && typeof record.id !== 'number')) return null;

  const mimetype = optionalString(record.mimetype);
  const rawUrl = optionalString(record.url);
  if (!mimetype?.startsWith('image/') || !rawUrl) return null;

  const browserOrigin = typeof location !== 'undefined' ? location.origin : undefined;
  const url = toPortableWebsiteAssetUrl(rawUrl, browserOrigin);
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
  if (preview) asset.preview = toPortableWebsiteAssetUrl(preview, browserOrigin);
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
