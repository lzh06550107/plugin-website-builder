import React from 'react';
import type { DeviceType, WebsiteNode } from '../../shared/schema';
import { NodeRenderer } from './NodeRenderer';

export interface WebsiteRendererProps {
  schema: WebsiteNode;
  device?: DeviceType;
  selectedNodeId?: string;
  onSelect?: (nodeId: string) => void;
}

export function WebsiteRenderer(props: WebsiteRendererProps) {
  return <NodeRenderer node={props.schema} device={props.device} selectedNodeId={props.selectedNodeId} onSelect={props.onSelect} />;
}
