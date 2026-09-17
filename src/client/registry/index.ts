import { ComponentRegistry } from './ComponentRegistry';
import { builtinComponentDefinitions } from './builtins';

export * from './types';
export * from './ComponentRegistry';
export * from './builtins';

export const componentRegistry = new ComponentRegistry();
builtinComponentDefinitions.forEach((definition) => componentRegistry.register(definition));
