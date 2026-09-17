import React from 'react';
import type { DeviceType, WebsiteNode } from '../../shared/schema';
import { componentRegistry } from '../registry';
import { getEmptyNodeHint, resolveEditorChromeStyle } from './editorChrome';
import { resolveNodeStyle } from './style';

export interface NodeRendererProps {
  node: WebsiteNode;
  device?: DeviceType;
  selectedNodeId?: string;
  onSelect?: (nodeId: string) => void;
}

export function NodeRenderer({ node, device = 'desktop', selectedNodeId, onSelect }: NodeRendererProps) {
  const definition = componentRegistry.get(node.type);
  if (!definition) {
    return <div data-wb-unknown-type={node.type}>Unknown component: {node.type}</div>;
  }

  const Component = definition.render;
  const editing = typeof onSelect === 'function';
  const selected = selectedNodeId === node.id;
  const style = resolveEditorChromeStyle(node, resolveNodeStyle(node, device), {
    editing,
    acceptsChildren: definition.acceptsChildren,
    selected,
  }) as React.CSSProperties;

  const children = node.children.map((child) => (
    <NodeRenderer
      key={child.id}
      node={child}
      device={device}
      selectedNodeId={selectedNodeId}
      onSelect={onSelect}
    />
  ));

  const emptyPlaceholder = editing && definition.acceptsChildren && node.children.length === 0 ? (
    <div
      data-wb-empty-placeholder={node.type}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onSelect?.(node.id);
      }}
      style={{
        minHeight: node.type === 'wb.section' ? 120 : node.type === 'wb.page' ? 180 : 72,
        margin: node.type === 'wb.page' ? 16 : 8,
        padding: 16,
        boxSizing: 'border-box',
        border: '1px dashed #91caff',
        borderRadius: 6,
        background: 'rgba(22, 119, 255, 0.035)',
        color: '#1677ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: 13,
        gridColumn: node.type === 'wb.grid' ? '1 / -1' : undefined,
        cursor: 'pointer',
      }}
    >
      {getEmptyNodeHint(node.type)}
    </div>
  ) : null;

  return (
    <Component node={node} device={device} style={style} onSelect={onSelect} selected={selected}>
      {emptyPlaceholder || children}
    </Component>
  );
}
