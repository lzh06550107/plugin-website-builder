import test from 'node:test';
import assert from 'node:assert/strict';
import { createNode, createPageRoot } from '../schema';
import { getNodePath } from '../tree';

test('returns root-to-selected-node path for breadcrumb selection', () => {
  const heading = createNode('wb.heading', 'heading-1', { text: 'Title' });
  const grid = { ...createNode('wb.grid', 'grid-1'), children: [heading] };
  const container = { ...createNode('wb.container', 'container-1'), children: [grid] };
  const root = { ...createPageRoot('root'), children: [container] };

  assert.deepEqual(
    getNodePath(root, 'heading-1').map((node) => node.id),
    ['root', 'container-1', 'grid-1', 'heading-1'],
  );
});

test('returns root only for root and empty array for unknown node', () => {
  const root = createPageRoot('root');
  assert.deepEqual(getNodePath(root, 'root').map((node) => node.id), ['root']);
  assert.deepEqual(getNodePath(root, 'missing'), []);
});
