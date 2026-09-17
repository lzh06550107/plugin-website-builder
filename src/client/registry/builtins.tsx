import React from 'react';
import type { WebsiteComponentDefinition, WebsiteComponentRenderProps } from './types';

function frameProps(props: WebsiteComponentRenderProps) {
  const editing = Boolean(props.onSelect);
  return {
    style: props.style,
    draggable: editing && props.node.type !== 'wb.page',
    'data-wb-node-id': props.node.id,
    'data-wb-node-type': props.node.type,
    onClick: (event: React.MouseEvent) => {
      if (props.onSelect) event.preventDefault();
      event.stopPropagation();
      props.onSelect?.(props.node.id);
    },
  };
}

const Page = (props: WebsiteComponentRenderProps) => <main {...frameProps(props)}>{props.children}</main>;
const Section = (props: WebsiteComponentRenderProps) => <section {...frameProps(props)}>{props.children}</section>;
const Container = (props: WebsiteComponentRenderProps) => <div {...frameProps(props)}>{props.children}</div>;
const Grid = (props: WebsiteComponentRenderProps) => {
  const columns = Math.max(1, Number(props.node.props.columns || 3));
  const style: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: '24px',
    ...props.style,
  };
  return <div {...frameProps({ ...props, style })}>{props.children}</div>;
};
const Heading = (props: WebsiteComponentRenderProps) => {
  const level = Math.min(6, Math.max(1, Number(props.node.props.level || 2)));
  return React.createElement(`h${level}`, frameProps(props), String(props.node.props.text || ''));
};
const Text = (props: WebsiteComponentRenderProps) => <p {...frameProps(props)}>{String(props.node.props.text || '')}</p>;
const Image = (props: WebsiteComponentRenderProps) => (
  <img {...frameProps(props)} src={String(props.node.props.src || '')} alt={String(props.node.props.alt || '')} />
);
const Button = (props: WebsiteComponentRenderProps) => (
  <a {...frameProps(props)} href={String(props.node.props.href || '#')}>
    {String(props.node.props.text || 'Button')}
  </a>
);

const CONTENT_TYPES = ['wb.heading', 'wb.text', 'wb.image', 'wb.button'];

export const builtinComponentDefinitions: WebsiteComponentDefinition[] = [
  {
    type: 'wb.page',
    label: 'Page',
    category: 'layout',
    acceptsChildren: true,
    allowedChildTypes: ['wb.section'],
    render: Page,
  },
  {
    type: 'wb.section',
    label: 'Section',
    category: 'layout',
    acceptsChildren: true,
    allowedChildTypes: ['wb.container', 'wb.grid', ...CONTENT_TYPES],
    render: Section,
  },
  {
    type: 'wb.container',
    label: 'Container',
    category: 'layout',
    acceptsChildren: true,
    allowedChildTypes: ['wb.grid', ...CONTENT_TYPES],
    render: Container,
  },
  {
    type: 'wb.grid',
    label: 'Grid',
    category: 'layout',
    acceptsChildren: true,
    allowedChildTypes: ['wb.container', ...CONTENT_TYPES],
    render: Grid,
  },
  { type: 'wb.heading', label: 'Heading', category: 'content', acceptsChildren: false, render: Heading },
  { type: 'wb.text', label: 'Text', category: 'content', acceptsChildren: false, render: Text },
  { type: 'wb.image', label: 'Image', category: 'content', acceptsChildren: false, render: Image },
  { type: 'wb.button', label: 'Button', category: 'content', acceptsChildren: false, render: Button },
];
