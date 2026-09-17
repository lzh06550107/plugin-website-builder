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
}
