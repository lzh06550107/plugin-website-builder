import type { WebsiteNode } from './types';

const defaultPropsByType: Record<string, Record<string, unknown>> = {
  'wb.page': {},
  'wb.section': {},
  'wb.container': {},
  'wb.grid': { columns: 3 },
  'wb.heading': { text: 'Heading', level: 2 },
  'wb.text': { text: 'Text' },
  'wb.image': { src: '', alt: '' },
  'wb.button': { text: 'Button', href: '#' },
};

export function createNode(type: string, id: string, props: Record<string, unknown> = {}): WebsiteNode {
  return {
    id,
    type,
    props: { ...(defaultPropsByType[type] || {}), ...props },
    style: {},
    responsive: {},
    children: [],
  };
}

export function createPageRoot(id = 'page-root'): WebsiteNode {
  return createNode('wb.page', id);
}
