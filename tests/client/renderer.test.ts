import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { WebsitePageSchema } from '../../src/shared/schema/page';
import { WebsiteRenderer } from '../../src/client/renderer/WebsiteRenderer';

const schema: WebsitePageSchema = {
  version: 1,
  root: {
    id: 'root',
    type: 'wb.page',
    props: {},
    style: {},
    children: [
      {
        id: 'section',
        type: 'wb.section',
        props: {},
        style: {},
        children: [
          { id: 'heading', type: 'wb.heading', props: { text: 'Hello', level: 2 }, style: {}, children: [] },
          { id: 'text', type: 'wb.text', props: { text: 'World' }, style: {}, children: [] },
        ],
      },
    ],
  },
};

describe('WebsiteRenderer', () => {
  it('renders nested website nodes through the component registry', () => {
    const html = renderToStaticMarkup(React.createElement(WebsiteRenderer, { schema, device: 'desktop' }));

    expect(html).toContain('data-wb-node-id="root"');
    expect(html).toContain('<section');
    expect(html).toContain('<h2');
    expect(html).toContain('Hello</h2>');
    expect(html).toContain('World</p>');
  });
});
