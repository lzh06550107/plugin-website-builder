import test from 'node:test';
import assert from 'node:assert/strict';
import { componentRegistry } from '../../client/registry';

test('enforces strict Page -> Container -> Grid -> Content hierarchy', () => {
  assert.equal(componentRegistry.canContain('wb.page', 'wb.container'), true);
  for (const type of ['wb.section', 'wb.grid', 'wb.heading', 'wb.text', 'wb.image', 'wb.button']) {
    assert.equal(componentRegistry.canContain('wb.page', type), false, `page must reject ${type}`);
  }

  assert.equal(componentRegistry.canContain('wb.container', 'wb.grid'), true);
  for (const type of ['wb.section', 'wb.container', 'wb.heading', 'wb.text', 'wb.image', 'wb.button']) {
    assert.equal(componentRegistry.canContain('wb.container', type), false, `container must reject ${type}`);
  }

  for (const type of ['wb.heading', 'wb.text', 'wb.image', 'wb.button']) {
    assert.equal(componentRegistry.canContain('wb.grid', type), true, `grid should accept ${type}`);
  }
  for (const type of ['wb.section', 'wb.container', 'wb.grid']) {
    assert.equal(componentRegistry.canContain('wb.grid', type), false, `grid must reject ${type}`);
  }

  // Legacy Section remains renderable and may host a Container while old documents are migrated.
  assert.equal(componentRegistry.canContain('wb.section', 'wb.container'), true);
  for (const type of ['wb.section', 'wb.grid', 'wb.heading', 'wb.text', 'wb.image', 'wb.button']) {
    assert.equal(componentRegistry.canContain('wb.section', type), false, `legacy section must reject ${type}`);
  }

  for (const parent of ['wb.heading', 'wb.text', 'wb.image', 'wb.button']) {
    assert.equal(componentRegistry.canContain(parent, 'wb.text'), false, `${parent} must remain a leaf`);
  }

  assert.equal(componentRegistry.canContain('wb.unknown', 'wb.text'), false);
  assert.equal(componentRegistry.canContain('wb.grid', 'wb.unknown'), false);
});
