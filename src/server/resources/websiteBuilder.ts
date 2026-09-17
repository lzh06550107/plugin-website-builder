import { PageService } from '../services/PageService';
import { PublishService } from '../services/PublishService';

function values(ctx: any) {
  return ctx.action?.params?.values || {};
}

function plain(record: any) {
  return record?.toJSON ? record.toJSON() : record;
}

export function registerWebsiteBuilderResource(app: any) {
  app.resourceManager.define({
    name: 'websiteBuilder',
    actions: {
      async getDraft(ctx: any, next: any) {
        const { pageId } = values(ctx);
        ctx.body = await new PageService(ctx.db).getDraft(pageId);
        await next();
      },
      async saveDraft(ctx: any, next: any) {
        const { pageId, schema } = values(ctx);
        ctx.body = plain(await new PageService(ctx.db).saveDraft(pageId, schema));
        await next();
      },
      async publish(ctx: any, next: any) {
        const { pageId, publishNote } = values(ctx);
        ctx.body = plain(await new PublishService(ctx.db).publish(pageId, publishNote));
        await next();
      },
      async getPublished(ctx: any, next: any) {
        const { pageId } = values(ctx);
        ctx.body = plain(await new PublishService(ctx.db).getPublished(pageId));
        await next();
      },
      async getPublishedByPath(ctx: any, next: any) {
        const { siteKey, routePath } = values(ctx);
        ctx.body = plain(await new PublishService(ctx.db).getPublishedByPath(siteKey, routePath));
        await next();
      },
    },
  });
}
