import test from 'node:test';
import assert from 'node:assert/strict';
import { createNode, createPageRoot } from '../schema';
import { getAncestorIds } from '../tree';

test('returns ancestors from root to direct parent for layer auto expansion', () => {
  const heading = createNode('wb.heading', 'heading-1');
  const container = { ...createNode('wb.container', 'container-1'), children: [heading] };
  const section = { ...createNode('wb.section', 'section-1'), children: [container] };
  const root = { ...createPageRoot('root'), children: [section] };

  assert.deepEqual(getAncestorIds(root, 'heading-1'), ['root', 'section-1', 'container-1']);
  assert.deepEqual(getAncestorIds(root, 'section-1'), ['root']);
  assert.deepEqual(getAncestorIds(root, 'root'), []);
  assert.deepEqual(getAncestorIds(root, 'missing'), []);
});
