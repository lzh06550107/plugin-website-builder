import React from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import type { WebsiteComponentDefinition, WebsiteComponentRenderProps } from './ComponentRegistry';

function interactiveProps(props: WebsiteComponentRenderProps) {
  const style: CSSProperties = {
    ...props.style,
    ...(props.selected ? { outline: '2px solid #1677ff', outlineOffset: '2px' } : undefined),
  };

  return {
    'data-wb-node-id': props.node.id,
    style,
    onClick: props.onSelect
      ? (event: MouseEvent) => {
          event.stopPropagation();
          props.onSelect?.(props.node.id);
        }
      : undefined,
  };
}

const PageRenderer = (props: WebsiteComponentRenderProps) =>
  React.createElement('div', interactiveProps(props), props.children);
const SectionRenderer = (props: WebsiteComponentRenderProps) =>
  React.createElement('section', interactiveProps(props), props.children);
const ContainerRenderer = (props: WebsiteComponentRenderProps) =>
  React.createElement('div', interactiveProps(props), props.children);
const GridRenderer = (props: WebsiteComponentRenderProps) =>
  React.createElement('div', interactiveProps(props), props.children);
const HeadingRenderer = (props: WebsiteComponentRenderProps) => {
  const rawLevel = Number(props.node.props.level ?? 2);
  const level = Math.min(6, Math.max(1, Number.isFinite(rawLevel) ? rawLevel : 2));
  return React.createElement(`h${level}`, interactiveProps(props), String(props.node.props.text ?? ''));
};
const TextRenderer = (props: WebsiteComponentRenderProps) =>
  React.createElement('p', interactiveProps(props), String(props.node.props.text ?? ''));
const ImageRenderer = (props: WebsiteComponentRenderProps) =>
  React.createElement('img', {
    ...interactiveProps(props),
    src: String(props.node.props.src ?? ''),
    alt: String(props.node.props.alt ?? ''),
  });
const ButtonRenderer = (props: WebsiteComponentRenderProps) =>
  React.createElement(
    'a',
    { ...interactiveProps(props), href: String(props.node.props.href ?? '#') },
    String(props.node.props.text ?? 'Button'),
  );

export const builtinComponentDefinitions: WebsiteComponentDefinition[] = [
  {
    type: 'wb.page', label: 'Page', category: 'layout', canHaveChildren: true, defaultProps: {},
    defaultStyle: { layout: { width: '100%', minHeight: '100vh' } }, renderer: PageRenderer,
  },
  {
    type: 'wb.section', label: 'Section', category: 'layout', canHaveChildren: true, defaultProps: {},
    defaultStyle: { layout: { width: '100%' }, spacing: { paddingTop: '40px', paddingBottom: '40px' } },
    renderer: SectionRenderer,
  },
  {
    type: 'wb.container', label: 'Container', category: 'layout', canHaveChildren: true, defaultProps: {},
    defaultStyle: { layout: { width: '100%', maxWidth: '1200px' }, spacing: { marginLeft: 'auto', marginRight: 'auto' } },
    renderer: ContainerRenderer,
  },
  {
    type: 'wb.grid', label: 'Grid', category: 'layout', canHaveChildren: true, defaultProps: {},
    defaultStyle: { layout: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px' } },
    renderer: GridRenderer,
  },
  {
    type: 'wb.heading', label: 'Heading', category: 'content', canHaveChildren: false,
    defaultProps: { text: 'Heading', level: 2 },
    defaultStyle: { typography: { fontSize: '32px', fontWeight: 600, lineHeight: 1.2 } },
    renderer: HeadingRenderer,
  },
  {
    type: 'wb.text', label: 'Text', category: 'content', canHaveChildren: false, defaultProps: { text: 'Text' },
    defaultStyle: { typography: { fontSize: '16px', lineHeight: 1.6 } }, renderer: TextRenderer,
  },
  {
    type: 'wb.image', label: 'Image', category: 'content', canHaveChildren: false, defaultProps: { src: '', alt: '' },
    defaultStyle: { layout: { width: '100%' } }, renderer: ImageRenderer,
  },
  {
    type: 'wb.button', label: 'Button', category: 'content', canHaveChildren: false,
    defaultProps: { text: 'Button', href: '#' },
    defaultStyle: {
      spacing: { paddingTop: '10px', paddingRight: '18px', paddingBottom: '10px', paddingLeft: '18px' },
      typography: { color: '#ffffff', fontWeight: 500 },
      background: { color: '#1677ff' }, border: { radius: '6px' },
    }, renderer: ButtonRenderer,
  },
];
