import React from 'react';
import type { DeviceType, WebsiteNode } from '../../shared/schema';
import { componentRegistry } from '../registry';
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
  const style = resolveNodeStyle(node, device) as React.CSSProperties;
  if (selectedNodeId === node.id) {
    style.outline = '2px solid currentColor';
    style.outlineOffset = '2px';
  }

  return (
    <Component node={node} device={device} style={style} onSelect={onSelect} selected={selectedNodeId === node.id}>
      {node.children.map((child) => (
        <NodeRenderer
          key={child.id}
          node={child}
          device={device}
          selectedNodeId={selectedNodeId}
          onSelect={onSelect}
        />
      ))}
    </Component>
  );
}
