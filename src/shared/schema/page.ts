import type { WebsiteNode } from './node';

export interface WebsitePageSchema {
  version: 1;
  root: WebsiteNode;
}

export const createEmptyPageSchema = (id = 'page-root'): WebsitePageSchema => ({
  version: 1,
  root: {
    id,
    type: 'wb.page',
    props: {},
    style: {
      layout: {
        width: '100%',
        minHeight: '100vh',
      },
    },
    children: [],
  },
});
