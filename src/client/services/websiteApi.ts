import type { WebsiteNode } from '../../shared/schema';

export interface SiteRecord {
  id: number | string;
  name: string;
  key: string;
  domain?: string;
  status?: string;
}

export interface PageRecord {
  id: number | string;
  siteId: number | string;
  name: string;
  title: string;
  slug: string;
  routePath: string;
  status?: string;
  draftSchema?: WebsiteNode;
  publishedVersionId?: number | string;
}

function dataOf<T>(response: any): T {
  return response?.data?.data as T;
}

export async function listSites(api: any): Promise<SiteRecord[]> {
  return dataOf<SiteRecord[]>(await api.resource('wbSites').list({ sort: ['-createdAt'] })) || [];
}

export async function createSite(api: any, values: Pick<SiteRecord, 'name' | 'key'>) {
  return dataOf<SiteRecord>(await api.resource('wbSites').create({ values }));
}

export async function listPages(api: any, siteId: number | string): Promise<PageRecord[]> {
  return dataOf<PageRecord[]>(await api.resource('wbPages').list({ filter: { siteId }, sort: ['createdAt'] })) || [];
}

export async function createPage(api: any, values: Omit<PageRecord, 'id'>) {
  return dataOf<PageRecord>(await api.resource('wbPages').create({ values }));
}

export async function getDraft(api: any, pageId: number | string): Promise<WebsiteNode | null> {
  const response = await api.request({ url: 'websiteBuilder:getDraft', method: 'post', data: { pageId } });
  return dataOf<WebsiteNode | null>(response) || null;
}

export async function saveDraft(api: any, pageId: number | string, schema: WebsiteNode) {
  const response = await api.request({ url: 'websiteBuilder:saveDraft', method: 'post', data: { pageId, schema } });
  return dataOf<PageRecord>(response);
}

export async function publishPage(api: any, pageId: number | string, publishNote?: string) {
  const response = await api.request({ url: 'websiteBuilder:publish', method: 'post', data: { pageId, publishNote } });
  return dataOf<any>(response);
}

export async function getPublishedByPath(api: any, siteKey: string, routePath: string) {
  const response = await api.request({ url: 'websiteBuilder:getPublishedByPath', method: 'post', data: { siteKey, routePath } });
  return dataOf<any>(response);
}
