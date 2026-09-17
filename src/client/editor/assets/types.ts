export interface WebsiteAsset {
  id: string | number;
  title?: string;
  filename?: string;
  mimetype?: string;
  url: string;
  preview?: string;
  size?: number;
  meta?: Record<string, unknown>;
}

export interface WebsiteAssetListOptions {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface WebsiteAssetPage {
  items: WebsiteAsset[];
  total: number;
  page: number;
  pageSize: number;
}
