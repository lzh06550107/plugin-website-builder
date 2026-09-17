import { describe, expect, it } from 'vitest';
import { registerWebsiteBuilderAcl } from '../../src/server/acl';

describe('website builder ACL', () => {
  it('keeps publication read-only public while edit/publish stay snippets', () => {
    const snippets: any[] = [];
    const allows: any[] = [];
    const app: any = {
      acl: {
        registerSnippet(value: any) { snippets.push(value); },
        allow(...args: any[]) { allows.push(args); },
      },
    };

    registerWebsiteBuilderAcl(app, '@lzh/plugin-website-builder');

    expect(snippets).toHaveLength(3);
    expect(snippets.some((item) => item.actions.includes('websiteBuilder:publish'))).toBe(true);
    expect(allows).toEqual([['websiteBuilder', 'published', 'public']]);
  });
});
