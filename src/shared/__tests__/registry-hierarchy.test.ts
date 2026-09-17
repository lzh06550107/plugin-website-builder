import test from 'node:test';
import assert from 'node:assert/strict';
import { componentRegistry } from '../../client/registry';

test('enforces builtin website component hierarchy', () => {
  assert.equal(componentRegistry.canContain('wb.page', 'wb.section'), true);
  assert.equal(componentRegistry.canContain('wb.page', 'wb.text'), false);

  for (const type of ['wb.container', 'wb.grid', 'wb.heading', 'wb.text', 'wb.image', 'wb.button']) {
    assert.equal(componentRegistry.canContain('wb.section', type), true, `section should accept ${type}`);
  }
  assert.equal(componentRegistry.canContain('wb.section', 'wb.section'), false);

  for (const type of ['wb.grid', 'wb.heading', 'wb.text', 'wb.image', 'wb.button']) {
    assert.equal(componentRegistry.canContain('wb.container', type), true, `container should accept ${type}`);
  }
  assert.equal(componentRegistry.canContain('wb.container', 'wb.section'), false);

  for (const type of ['wb.container', 'wb.heading', 'wb.text', 'wb.image', 'wb.button']) {
    assert.equal(componentRegistry.canContain('wb.grid', type), true, `grid should accept ${type}`);
  }

  for (const parent of ['wb.heading', 'wb.text', 'wb.image', 'wb.button']) {
    assert.equal(componentRegistry.canContain(parent, 'wb.text'), false, `${parent} must remain a leaf`);
  }

  assert.equal(componentRegistry.canContain('wb.unknown', 'wb.text'), false);
  assert.equal(componentRegistry.canContain('wb.section', 'wb.unknown'), false);
});
