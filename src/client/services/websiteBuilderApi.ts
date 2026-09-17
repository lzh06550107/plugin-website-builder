import type { WebsitePageSchema } from '../../shared/schema';

function dataOf(response: any) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function listSites(api: any) {
  return dataOf(await api.resource('wbSites').list({ pageSize: 100, sort: ['id'] })) || [];
}

export async function createSite(api: any, values: { name: string; key: string; domain?: string }) {
  return dataOf(await api.resource('wbSites').create({ values: { ...values, status: 'active' } }));
}

export async function listPages(api: any, siteId: string | number) {
  return dataOf(await api.resource('wbPages').list({ filter: { siteId }, pageSize: 200, sort: ['id'] })) || [];
}

export async function createPage(
  api: any,
  values: { siteId: string | number; name: string; title?: string; slug: string; draftSchema: WebsitePageSchema },
) {
  return dataOf(await api.resource('wbPages').create({ values: { ...values, status: 'draft' } }));
}

export async function savePageDraft(api: any, pageId: string | number, schema: WebsitePageSchema) {
  return dataOf(await api.resource('wbPages').update({ filterByTk: pageId, values: { draftSchema: schema } }));
}

export async function publishPage(api: any, pageId: string | number, note?: string) {
  return dataOf(await api.request({
    url: 'websiteBuilder:publish',
    method: 'POST',
    data: { pageId, note },
  }));
}

export async function loadPublishedPage(api: any, siteKey: string, slug: string) {
  return dataOf(await api.request({
    url: 'websiteBuilder:published',
    method: 'GET',
    params: { siteKey, slug },
  }));
}
