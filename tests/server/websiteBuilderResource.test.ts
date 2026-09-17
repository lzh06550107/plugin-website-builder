import { describe, expect, it } from 'vitest';
import { publishedPageAction } from '../../src/server/resources/websiteBuilder';

describe('websiteBuilder:published', () => {
  it('returns only the active published page version', async () => {
    const site = { id: 1, key: 'demo', status: 'active' };
    const page = { id: 2, siteId: 1, slug: 'home', status: 'published', publishedVersionId: 9 };
    const version = { id: 9, pageId: 2, version: 3, schema: { version: 1, root: { id: 'root' } } };
    const repositories: any = {
      wbSites: { async findOne() { return site; } },
      wbPages: { async findOne() { return page; } },
      wbPageVersions: { async findOne() { return version; } },
    };
    const ctx: any = {
      action: { params: { siteKey: 'demo', slug: 'home' } },
      db: { getRepository(name: string) { return repositories[name]; } },
    };
    let nextCalled = false;

    await publishedPageAction(ctx, async () => { nextCalled = true; });

    expect(ctx.body.site.key).toBe('demo');
    expect(ctx.body.page.slug).toBe('home');
    expect(ctx.body.version.version).toBe(3);
    expect(ctx.body.schema.root.id).toBe('root');
    expect(nextCalled).toBe(true);
  });
});
