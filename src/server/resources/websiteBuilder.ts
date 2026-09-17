import type { Context } from '@nocobase/actions';
import { PublishService } from '../services/PublishService';

function plain(record: any) {
  if (!record) return record;
  return typeof record.toJSON === 'function' ? record.toJSON() : record;
}

function field(record: any, key: string) {
  return typeof record?.get === 'function' ? record.get(key) : record?.[key];
}

export const publishPageAction = async (ctx: Context, next: () => Promise<unknown>) => {
  const params: any = ctx.action?.params || {};
  const pageId = params.pageId ?? params.values?.pageId ?? params.filterByTk;
  if (pageId == null) {
    ctx.throw(400, 'pageId is required');
  }

  const note = params.note ?? params.values?.note;
  const currentUser: any = (ctx as any).state?.currentUser;
  const version = await new PublishService(ctx.db as any).publish(pageId, currentUser?.id, note);
  ctx.body = plain(version);
  return next();
};

export const publishedPageAction = async (ctx: Context, next: () => Promise<unknown>) => {
  const params: any = ctx.action?.params || {};
  const siteKey = params.siteKey ?? params.values?.siteKey;
  const slug = params.slug ?? params.values?.slug;
  if (!siteKey || !slug) {
    ctx.throw(400, 'siteKey and slug are required');
  }

  const site = await ctx.db.getRepository('wbSites').findOne({
    filter: { key: siteKey, status: 'active' },
  });
  if (!site) {
    ctx.throw(404, 'Website site not found');
  }

  const page = await ctx.db.getRepository('wbPages').findOne({
    filter: { siteId: field(site, 'id'), slug, status: 'published' },
  });
  if (!page) {
    ctx.throw(404, 'Published website page not found');
  }

  const publishedVersionId = field(page, 'publishedVersionId');
  if (!publishedVersionId) {
    ctx.throw(404, 'Published website version not found');
  }

  const version = await ctx.db.getRepository('wbPageVersions').findOne({ filterByTk: publishedVersionId });
  if (!version) {
    ctx.throw(404, 'Published website version not found');
  }

  ctx.body = {
    site: plain(site),
    page: plain(page),
    version: plain(version),
    schema: field(version, 'schema'),
  };
  return next();
};

export function registerWebsiteBuilderResources(app: any) {
  app.resourceManager.define({
    name: 'websiteBuilder',
    actions: {
      publish: publishPageAction,
      published: publishedPageAction,
    },
    only: ['publish', 'published'],
  });
}
