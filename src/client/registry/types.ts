import type React from 'react';
import type { DeviceType, WebsiteNode } from '../../shared/schema';

export interface WebsiteComponentRenderProps {
  node: WebsiteNode;
  device: DeviceType;
  style: React.CSSProperties;
  children?: React.ReactNode;
  onSelect?: (nodeId: string) => void;
  selected?: boolean;
}

export interface WebsiteComponentDefinition {
  type: string;
  label: string;
  category: 'layout' | 'content';
  acceptsChildren: boolean;
  allowedChildTypes?: string[];
  canContain?: (childType: string) => boolean;
  render: React.ComponentType<WebsiteComponentRenderProps>;
}
