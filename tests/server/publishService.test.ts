import { describe, expect, it } from 'vitest';
import { PublishService } from '../../src/server/services/PublishService';

describe('PublishService', () => {
  it('creates the next immutable version and marks the page published', async () => {
    const page: any = {
      id: 7,
      draftSchema: { version: 1, root: { id: 'root', type: 'wb.page', props: {}, style: {}, children: [] } },
      status: 'draft',
    };
    const versions: any[] = [{ id: 11, pageId: 7, version: 1, schema: { old: true } }];
    const pageRepository = {
      async findOne({ filterByTk }: any) {
        return filterByTk === 7 ? page : null;
      },
      async update({ values }: any) {
        Object.assign(page, values);
        return page;
      },
    };
    const versionRepository = {
      async findOne() {
        return versions.at(-1) ?? null;
      },
      async create({ values }: any) {
        const record = { id: 12, ...values };
        versions.push(record);
        return record;
      },
    };
    const db: any = {
      getRepository(name: string) {
        if (name === 'wbPages') return pageRepository;
        if (name === 'wbPageVersions') return versionRepository;
        throw new Error(name);
      },
      sequelize: {
        async transaction(callback: any) {
          return callback({ id: 'transaction' });
        },
      },
    };

    const published: any = await new PublishService(db).publish(7, 99, 'release');

    expect(published.version).toBe(2);
    expect(published.pageId).toBe(7);
    expect(published.createdById).toBe(99);
    expect(page.status).toBe('published');
    expect(page.publishedVersionId).toBe(12);

    page.draftSchema.root.children.push({ id: 'later' });
    expect(published.schema.root.children).toHaveLength(0);
  });
});
