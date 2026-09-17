import { PageService } from '../services/PageService';
import { PublishService } from '../services/PublishService';

function values(ctx: any) {
  return ctx.action?.params?.values || {};
}

export function registerWebsiteBuilderResource(app: any) {
  app.resourceManager.define({
    name: 'websiteBuilder',
    actions: {
      async getDraft(ctx: any, next: any) {
        const { pageId } = values(ctx);
        ctx.body = { data: await new PageService(ctx.db).getDraft(pageId) };
        await next();
      },
      async saveDraft(ctx: any, next: any) {
        const { pageId, schema } = values(ctx);
        const page = await new PageService(ctx.db).saveDraft(pageId, schema);
        ctx.body = { data: page?.toJSON ? page.toJSON() : page };
        await next();
      },
      async publish(ctx: any, next: any) {
        const { pageId, publishNote } = values(ctx);
        const version = await new PublishService(ctx.db).publish(pageId, publishNote);
        ctx.body = { data: version?.toJSON ? version.toJSON() : version };
        await next();
      },
      async getPublished(ctx: any, next: any) {
        const { pageId } = values(ctx);
        const version = await new PublishService(ctx.db).getPublished(pageId);
        ctx.body = { data: version?.toJSON ? version.toJSON() : version };
        await next();
      },
      async getPublishedByPath(ctx: any, next: any) {
        const { siteKey, routePath } = values(ctx);
        const version = await new PublishService(ctx.db).getPublishedByPath(siteKey, routePath);
        ctx.body = { data: version?.toJSON ? version.toJSON() : version };
        await next();
      },
    },
  });
}
