import type { WebsiteNode } from '../../shared/schema';
import { assertValidWebsiteSchema } from './schema';

export class PageService {
  constructor(private readonly db: any) {}

  async getPage(pageId: number | string) {
    const page = await this.db.getRepository('wbPages').findOne({ filterByTk: pageId });
    if (!page) throw new Error(`Website page not found: ${pageId}`);
    return page;
  }

  async getDraft(pageId: number | string) {
    const page = await this.getPage(pageId);
    return page.toJSON ? page.toJSON().draftSchema : page.draftSchema;
  }

  async saveDraft(pageId: number | string, schema: WebsiteNode) {
    assertValidWebsiteSchema(schema);
    await this.db.getRepository('wbPages').update({
      filterByTk: pageId,
      values: { draftSchema: schema, status: 'draft' },
    });
    return this.getPage(pageId);
  }
}
