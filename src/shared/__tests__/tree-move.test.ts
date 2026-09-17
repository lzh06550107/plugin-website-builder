import test from 'node:test';
import assert from 'node:assert/strict';
import { createNode, createPageRoot } from '../schema';
import {
  findNode,
  findNodeLocation,
  getParentNode,
  insertNodeAt,
  isDescendant,
  moveNode,
  reorderNode,
} from '../tree';

function fixture() {
  const heading = createNode('wb.heading', 'heading-1', { text: 'H' });
  const text = createNode('wb.text', 'text-1', { text: 'T' });
  const nested = { ...createNode('wb.container', 'container-1'), children: [heading, text] };
  const section1 = { ...createNode('wb.section', 'section-1'), children: [nested] };
  const section2 = createNode('wb.section', 'section-2');
  return { ...createPageRoot('root'), children: [section1, section2] };
}

test('finds node location and parent', () => {
  const root = fixture();
  const location = findNodeLocation(root, 'text-1');
  assert.equal(location?.parentId, 'container-1');
  assert.equal(location?.index, 1);
  assert.equal(getParentNode(root, 'text-1')?.id, 'container-1');
  assert.equal(isDescendant(root, 'section-1', 'text-1'), true);
  assert.equal(isDescendant(root, 'text-1', 'section-1'), false);
});

test('inserts at start middle and end without mutating original', () => {
  const root = fixture();
  const a = insertNodeAt(root, 'section-2', createNode('wb.text', 'a'), 0);
  const b = insertNodeAt(a, 'section-2', createNode('wb.text', 'b'), 1);
  const c = insertNodeAt(b, 'section-2', createNode('wb.text', 'c'), 99);
  assert.deepEqual(findNode(c, 'section-2')?.children.map((node) => node.id), ['a', 'b', 'c']);
  assert.deepEqual(findNode(root, 'section-2')?.children, []);
});

test('reorders forward and backward', () => {
  const root = insertNodeAt(
    insertNodeAt(
      insertNodeAt(fixture(), 'section-2', createNode('wb.text', 'a'), 0),
      'section-2',
      createNode('wb.text', 'b'),
      1,
    ),
    'section-2',
    createNode('wb.text', 'c'),
    2,
  );
  const forward = reorderNode(root, 'section-2', 0, 2);
  assert.deepEqual(findNode(forward, 'section-2')?.children.map((node) => node.id), ['b', 'c', 'a']);
  const backward = reorderNode(forward, 'section-2', 2, 0);
  assert.deepEqual(findNode(backward, 'section-2')?.children.map((node) => node.id), ['a', 'b', 'c']);
});

test('moves across parents and preserves subtree', () => {
  const root = fixture();
  const moved = moveNode(root, 'container-1', 'section-2', 0);
  assert.equal(findNode(moved, 'section-1')?.children.length, 0);
  assert.equal(findNode(moved, 'section-2')?.children[0].id, 'container-1');
  assert.equal(findNode(moved, 'heading-1')?.props.text, 'H');
  assert.equal(findNode(root, 'section-1')?.children[0].id, 'container-1');
});
