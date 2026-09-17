import test from 'node:test';
import assert from 'node:assert/strict';
import { createNode, createPageRoot } from '../schema';
import { findNode } from '../tree';
import { componentRegistry } from '../../client/registry';
import { findInsertionParent, insertComponent, moveEditorNode, validateMove } from '../../client/editor/commands';

function fixture() {
  const heading = createNode('wb.heading', 'heading-1');
  const container1 = { ...createNode('wb.container', 'container-1'), children: [heading] };
  const section1 = { ...createNode('wb.section', 'section-1'), children: [container1] };
  const container2 = createNode('wb.container', 'container-2');
  const section2 = { ...createNode('wb.section', 'section-2'), children: [container2] };
  return { ...createPageRoot('root'), children: [section1, section2] };
}

test('finds selected or nearest legal insertion parent', () => {
  const root = fixture();
  assert.equal(findInsertionParent(root, componentRegistry, 'section-1', 'wb.grid')?.id, 'section-1');
  assert.equal(findInsertionParent(root, componentRegistry, 'heading-1', 'wb.text')?.id, 'container-1');
  assert.equal(findInsertionParent(root, componentRegistry, 'heading-1', 'wb.section')?.id, 'root');
  assert.equal(findInsertionParent(root, componentRegistry, 'root', 'wb.text'), undefined);
});

test('inserts with hierarchy awareness and supports explicit indexed target', () => {
  const root = fixture();
  const sibling = insertComponent(root, componentRegistry, 'heading-1', createNode('wb.text', 'text-1'));
  assert.equal(sibling.inserted, true);
  assert.deepEqual(findNode(sibling.document, 'container-1')?.children.map((node) => node.id), ['heading-1', 'text-1']);

  const targeted = insertComponent(
    sibling.document,
    componentRegistry,
    undefined,
    createNode('wb.button', 'button-1'),
    { parentId: 'container-1', index: 0 },
  );
  assert.equal(targeted.inserted, true);
  assert.deepEqual(findNode(targeted.document, 'container-1')?.children.map((node) => node.id), ['button-1', 'heading-1', 'text-1']);

  const invalid = insertComponent(root, componentRegistry, 'root', createNode('wb.text', 'bad'));
  assert.equal(invalid.inserted, false);
  assert.equal(invalid.document, root);
});

test('rejects root self descendant and invalid hierarchy moves', () => {
  const root = fixture();
  assert.equal(validateMove(root, componentRegistry, 'root', 'section-1').valid, false);
  assert.equal(validateMove(root, componentRegistry, 'container-1', 'container-1').valid, false);
  assert.equal(validateMove(root, componentRegistry, 'section-1', 'container-1').valid, false);
  assert.equal(validateMove(root, componentRegistry, 'section-2', 'container-1').valid, false);
});

test('moves valid nodes across legal containers', () => {
  const root = fixture();
  const result = moveEditorNode(root, componentRegistry, 'heading-1', 'container-2', 0);
  assert.equal(result.moved, true);
  assert.equal(findNode(result.document, 'container-1')?.children.length, 0);
  assert.equal(findNode(result.document, 'container-2')?.children[0].id, 'heading-1');
  assert.ok(findNode(root, 'heading-1'));
});
