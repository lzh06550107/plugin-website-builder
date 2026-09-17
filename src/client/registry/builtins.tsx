import type { WebsiteComponentDefinition } from './ComponentRegistry';

export const builtinComponentDefinitions: WebsiteComponentDefinition[] = [
  {
    type: 'wb.page',
    label: 'Page',
    category: 'layout',
    canHaveChildren: true,
    defaultProps: {},
    defaultStyle: { layout: { width: '100%', minHeight: '100vh' } },
  },
  {
    type: 'wb.section',
    label: 'Section',
    category: 'layout',
    canHaveChildren: true,
    defaultProps: {},
    defaultStyle: { layout: { width: '100%' }, spacing: { paddingTop: '40px', paddingBottom: '40px' } },
  },
  {
    type: 'wb.container',
    label: 'Container',
    category: 'layout',
    canHaveChildren: true,
    defaultProps: {},
    defaultStyle: {
      layout: { width: '100%', maxWidth: '1200px' },
      spacing: { marginLeft: 'auto', marginRight: 'auto' },
    },
  },
  {
    type: 'wb.grid',
    label: 'Grid',
    category: 'layout',
    canHaveChildren: true,
    defaultProps: {},
    defaultStyle: {
      layout: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px' },
    },
  },
  {
    type: 'wb.heading',
    label: 'Heading',
    category: 'content',
    canHaveChildren: false,
    defaultProps: { text: 'Heading', level: 2 },
    defaultStyle: { typography: { fontSize: '32px', fontWeight: 600, lineHeight: 1.2 } },
  },
  {
    type: 'wb.text',
    label: 'Text',
    category: 'content',
    canHaveChildren: false,
    defaultProps: { text: 'Text' },
    defaultStyle: { typography: { fontSize: '16px', lineHeight: 1.6 } },
  },
  {
    type: 'wb.image',
    label: 'Image',
    category: 'content',
    canHaveChildren: false,
    defaultProps: { src: '', alt: '' },
    defaultStyle: { layout: { width: '100%' } },
  },
  {
    type: 'wb.button',
    label: 'Button',
    category: 'content',
    canHaveChildren: false,
    defaultProps: { text: 'Button', href: '#' },
    defaultStyle: {
      spacing: { paddingTop: '10px', paddingRight: '18px', paddingBottom: '10px', paddingLeft: '18px' },
      typography: { color: '#ffffff', fontWeight: 500 },
      background: { color: '#1677ff' },
      border: { radius: '6px' },
    },
  },
];
