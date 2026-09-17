import type { WebsiteNode } from '../../shared/schema';
import { assertValidWebsiteSchema, nextPageVersion } from './schema';
import { PageService } from './PageService';

function plain(record: any) {
  return record?.toJSON ? record.toJSON() : record;
}

export class PublishService {
  constructor(private readonly db: any) {}

  async publish(pageId: number | string, publishNote?: string) {
    const pageService = new PageService(this.db);
    const page = plain(await pageService.getPage(pageId));
    const schema = assertValidWebsiteSchema(page.draftSchema as WebsiteNode);

    return this.db.sequelize.transaction(async (transaction: any) => {
      const versions = this.db.getRepository('wbPageVersions');
      const latestRecord = await versions.findOne({
        filter: { pageId },
        sort: ['-version'],
        transaction,
      });
      const version = nextPageVersion(plain(latestRecord)?.version);
      const created = await versions.create({
        values: { pageId, version, schema, publishNote: publishNote || null },
        transaction,
      });
      const createdPlain = plain(created);
      await this.db.getRepository('wbPages').update({
        filterByTk: pageId,
        values: { publishedVersionId: createdPlain.id, status: 'published' },
        transaction,
      });
      return created;
    });
  }

  async getPublished(pageId: number | string) {
    const page = plain(await new PageService(this.db).getPage(pageId));
    if (!page.publishedVersionId) return null;
    return this.db.getRepository('wbPageVersions').findOne({ filterByTk: page.publishedVersionId });
  }

  async getPublishedByPath(siteKey: string, routePath: string) {
    const site = plain(await this.db.getRepository('wbSites').findOne({ filter: { key: siteKey } }));
    if (!site) return null;
    const page = plain(await this.db.getRepository('wbPages').findOne({ filter: { siteId: site.id, routePath } }));
    if (!page?.publishedVersionId) return null;
    return this.db.getRepository('wbPageVersions').findOne({ filterByTk: page.publishedVersionId });
  }
}
