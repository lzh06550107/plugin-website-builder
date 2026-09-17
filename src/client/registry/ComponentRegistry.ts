import type { WebsiteComponentDefinition } from './types';

export class ComponentRegistry {
  private readonly definitions = new Map<string, WebsiteComponentDefinition>();

  register(definition: WebsiteComponentDefinition) {
    if (!definition.type.startsWith('wb.')) {
      throw new Error(`Website component type must use wb.* namespace: ${definition.type}`);
    }
    this.definitions.set(definition.type, definition);
    return this;
  }

  get(type: string) {
    return this.definitions.get(type);
  }

  list() {
    return Array.from(this.definitions.values());
  }

  canContain(parentType: string, childType: string) {
    const parent = this.get(parentType);
    const child = this.get(childType);
    if (!parent || !child || !parent.acceptsChildren) return false;
    if (parent.canContain) return parent.canContain(childType);
    if (parent.allowedChildTypes) return parent.allowedChildTypes.includes(childType);
    return true;
  }
}
