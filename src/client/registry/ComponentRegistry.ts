import type { ComponentType, ReactNode } from 'react';
import type { WebsiteNode, WebsiteNodeType, WebsiteStyle } from '../../shared/schema';
import type { WebsiteDevice } from '../../shared/schema/responsive';

export interface WebsiteComponentRenderProps {
  node: WebsiteNode;
  device: WebsiteDevice;
  selected?: boolean;
  onSelect?: (nodeId: string) => void;
  children?: ReactNode;
}

export interface WebsiteComponentDefinition {
  type: WebsiteNodeType;
  label: string;
  category: 'layout' | 'content';
  canHaveChildren: boolean;
  defaultProps: Record<string, unknown>;
  defaultStyle: WebsiteStyle;
  renderer?: ComponentType<WebsiteComponentRenderProps>;
}

export class ComponentRegistry {
  private readonly definitions = new Map<WebsiteNodeType, WebsiteComponentDefinition>();

  register(definition: WebsiteComponentDefinition) {
    if (this.definitions.has(definition.type)) {
      throw new Error(`Website component already registered: ${definition.type}`);
    }
    this.definitions.set(definition.type, definition);
    return this;
  }

  get(type: WebsiteNodeType) {
    return this.definitions.get(type);
  }

  list(category?: WebsiteComponentDefinition['category']) {
    const items = Array.from(this.definitions.values());
    return category ? items.filter((item) => item.category === category) : items;
  }
}
