import { ComponentRegistry } from './ComponentRegistry';
import { builtinComponentDefinitions } from './builtins';

export * from './ComponentRegistry';
export * from './builtins';

export const websiteComponentRegistry = new ComponentRegistry();

for (const definition of builtinComponentDefinitions) {
  websiteComponentRegistry.register(definition);
}
