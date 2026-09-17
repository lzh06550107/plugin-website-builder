import test from 'node:test';
import assert from 'node:assert/strict';
import { createNode, createPageRoot } from '../schema';
import { findNode } from '../tree';
import { duplicateEditorNode, moveEditorNodeRelative } from '../../client/editor/commands';

function buildDocument() {
  const page = createPageRoot('page');
  const container = createNode('wb.container', 'container');
  const grid = createNode('wb.grid', 'grid');
  const heading = createNode('wb.heading', 'heading', { text: 'A' });
  const text = createNode('wb.text', 'text', { text: 'B' });
  grid.children = [heading, text];
  container.children = [grid];
  page.children = [container];
  return page;
}

test('duplicates the targeted subtree immediately after the source with fresh ids', () => {
  const document = buildDocument();
  const ids = ['grid-copy', 'heading-copy', 'text-copy'];
  const result = duplicateEditorNode(document, 'grid', () => ids.shift() || 'unexpected');

  assert.equal(result.duplicated, true);
  assert.equal(result.nodeId, 'grid-copy');
  assert.deepEqual(findNode(result.document, 'container')?.children.map((node) => node.id), ['grid', 'grid-copy']);
  assert.deepEqual(findNode(result.document, 'grid-copy')?.children.map((node) => node.id), ['heading-copy', 'text-copy']);
  assert.equal(findNode(result.document, 'heading-copy')?.props.text, 'A');
  assert.equal(findNode(document, 'grid-copy'), undefined);
});

test('never duplicates the root page', () => {
  const document = buildDocument();
  const result = duplicateEditorNode(document, 'page', () => 'copy');
  assert.equal(result.duplicated, false);
  assert.equal(result.document, document);
});

test('moves a targeted sibling up and down without changing parent', () => {
  const document = buildDocument();
  const movedUp = moveEditorNodeRelative(document, 'text', 'up');
  assert.equal(movedUp.moved, true);
  assert.deepEqual(findNode(movedUp.document, 'grid')?.children.map((node) => node.id), ['text', 'heading']);

  const movedDown = moveEditorNodeRelative(movedUp.document, 'text', 'down');
  assert.equal(movedDown.moved, true);
  assert.deepEqual(findNode(movedDown.document, 'grid')?.children.map((node) => node.id), ['heading', 'text']);
});

test('relative move is a no-op at sibling boundaries', () => {
  const document = buildDocument();
  const up = moveEditorNodeRelative(document, 'heading', 'up');
  const down = moveEditorNodeRelative(document, 'text', 'down');
  assert.equal(up.moved, false);
  assert.equal(up.document, document);
  assert.equal(down.moved, false);
  assert.equal(down.document, document);
});
