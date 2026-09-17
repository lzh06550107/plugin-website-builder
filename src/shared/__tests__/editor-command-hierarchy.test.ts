import test from 'node:test';
import assert from 'node:assert/strict';
import { createNode, createPageRoot } from '../schema';
import { findNode } from '../tree';
import { componentRegistry } from '../../client/registry';
import { findInsertionParent, insertComponent, moveEditorNode, validateMove } from '../../client/editor/commands';

function fixture() {
  const heading = createNode('wb.heading', 'heading-1');
  const grid1 = { ...createNode('wb.grid', 'grid-1'), children: [heading] };
  const container1 = { ...createNode('wb.container', 'container-1'), children: [grid1] };
  const grid2 = createNode('wb.grid', 'grid-2');
  const container2 = { ...createNode('wb.container', 'container-2'), children: [grid2] };
  return { ...createPageRoot('root'), children: [container1, container2] };
}

test('finds selected or nearest legal insertion parent', () => {
  const root = fixture();
  assert.equal(findInsertionParent(root, componentRegistry, 'root', 'wb.container')?.id, 'root');
  assert.equal(findInsertionParent(root, componentRegistry, 'container-1', 'wb.grid')?.id, 'container-1');
  assert.equal(findInsertionParent(root, componentRegistry, 'heading-1', 'wb.text')?.id, 'grid-1');
  assert.equal(findInsertionParent(root, componentRegistry, 'heading-1', 'wb.grid')?.id, 'container-1');
  assert.equal(findInsertionParent(root, componentRegistry, 'root', 'wb.text'), undefined);
});

test('inserts with hierarchy awareness and supports explicit indexed target', () => {
  const root = fixture();
  const sibling = insertComponent(root, componentRegistry, 'heading-1', createNode('wb.text', 'text-1'));
  assert.equal(sibling.inserted, true);
  assert.deepEqual(findNode(sibling.document, 'grid-1')?.children.map((node) => node.id), ['heading-1', 'text-1']);

  const targeted = insertComponent(
    sibling.document,
    componentRegistry,
    undefined,
    createNode('wb.button', 'button-1'),
    { parentId: 'grid-1', index: 0 },
  );
  assert.equal(targeted.inserted, true);
  assert.deepEqual(findNode(targeted.document, 'grid-1')?.children.map((node) => node.id), ['button-1', 'heading-1', 'text-1']);

  const invalidTextAtPage = insertComponent(root, componentRegistry, 'root', createNode('wb.text', 'bad-text'));
  assert.equal(invalidTextAtPage.inserted, false);
  assert.equal(invalidTextAtPage.document, root);

  const invalidGridAtPage = insertComponent(
    root,
    componentRegistry,
    undefined,
    createNode('wb.grid', 'bad-grid'),
    { parentId: 'root', index: 0 },
  );
  assert.equal(invalidGridAtPage.inserted, false);
});

test('rejects root self descendant and invalid hierarchy moves', () => {
  const root = fixture();
  assert.equal(validateMove(root, componentRegistry, 'root', 'container-1').valid, false);
  assert.equal(validateMove(root, componentRegistry, 'container-1', 'container-1').valid, false);
  assert.equal(validateMove(root, componentRegistry, 'container-1', 'grid-1').valid, false);
  assert.equal(validateMove(root, componentRegistry, 'grid-2', 'grid-1').valid, false);
});

test('moves valid content nodes across grids', () => {
  const root = fixture();
  const result = moveEditorNode(root, componentRegistry, 'heading-1', 'grid-2', 0);
  assert.equal(result.moved, true);
  assert.equal(findNode(result.document, 'grid-1')?.children.length, 0);
  assert.equal(findNode(result.document, 'grid-2')?.children[0].id, 'heading-1');
  assert.ok(findNode(root, 'heading-1'));
});
