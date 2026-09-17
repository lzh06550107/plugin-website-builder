import React from 'react';
import type { WebsitePageSchema, WebsiteNode } from '../../shared/schema';
import type { WebsiteDevice } from '../../shared/schema/responsive';
import { websiteComponentRegistry } from '../registry';
import type { ComponentRegistry } from '../registry/ComponentRegistry';
import { resolveNodeStyle } from './styleResolver';

export interface WebsiteRendererProps {
  schema: WebsitePageSchema;
  device?: WebsiteDevice;
  selectedNodeId?: string;
  onSelect?: (nodeId: string) => void;
  registry?: ComponentRegistry;
}

function renderNode(
  node: WebsiteNode,
  device: WebsiteDevice,
  registry: ComponentRegistry,
  selectedNodeId?: string,
  onSelect?: (nodeId: string) => void,
): React.ReactNode {
  const definition = registry.get(node.type);
  const children = node.children.map((child) =>
    renderNode(child, device, registry, selectedNodeId, onSelect),
  );

  if (!definition?.renderer) {
    return React.createElement(
      'div',
      {
        key: node.id,
        'data-wb-node-id': node.id,
        'data-wb-unknown-component': node.type,
        style: resolveNodeStyle(node, device),
      },
      children,
    );
  }

  return React.createElement(
    definition.renderer,
    {
      key: node.id,
      node,
      device,
      style: resolveNodeStyle(node, device),
      selected: selectedNodeId === node.id,
      onSelect,
    },
    children,
  );
}

export function WebsiteRenderer({
  schema,
  device = 'desktop',
  selectedNodeId,
  onSelect,
  registry = websiteComponentRegistry,
}: WebsiteRendererProps) {
  return renderNode(schema.root, device, registry, selectedNodeId, onSelect);
}
