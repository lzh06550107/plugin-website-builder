import { describe, expect, it } from 'vitest';
import { ComponentRegistry } from '../../src/client/registry/ComponentRegistry';

describe('ComponentRegistry', () => {
  it('registers and filters component definitions', () => {
    const registry = new ComponentRegistry();
    registry.register({
      type: 'wb.text',
      label: 'Text',
      category: 'content',
      canHaveChildren: false,
      defaultProps: { text: 'Text' },
      defaultStyle: {},
    });

    expect(registry.get('wb.text')?.label).toBe('Text');
    expect(registry.list('content')).toHaveLength(1);
  });

  it('rejects duplicate component types', () => {
    const registry = new ComponentRegistry();
    const definition = {
      type: 'wb.text' as const,
      label: 'Text',
      category: 'content' as const,
      canHaveChildren: false,
      defaultProps: {},
      defaultStyle: {},
    };

    registry.register(definition);
    expect(() => registry.register(definition)).toThrow(/already registered/);
  });
});
