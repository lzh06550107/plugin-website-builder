import test from 'node:test';
import assert from 'node:assert/strict';
import { createNode, createPageRoot } from '../schema';
import { findNode } from '../tree';
import { createEditorState, editorReducer } from '../../client/editor/state';
import {
  deleteEditorNode,
  insertChild,
  removeEditorNode,
  updateNodeProps,
  updateNodeStyle,
} from '../../client/editor/commands';

test('editor preserves selection when document changes', () => {
  const root = createPageRoot('root');
  const state = createEditorState(root);
  const selected = editorReducer(state, { type: 'select', nodeId: 'root' });
  const nextDocument = { ...root, props: { title: 'Home' } };
  const replaced = editorReducer(selected, { type: 'replace-document', document: nextDocument });
  assert.equal(replaced.selectedNodeId, 'root');
  assert.equal(replaced.document.props.title, 'Home');
});

test('device action switches between desktop and mobile', () => {
  const state = createEditorState(createPageRoot('root'));
  assert.equal(editorReducer(state, { type: 'set-device', device: 'mobile' }).device, 'mobile');
});

test('editor tracks and clears drag source and drop target', () => {
  const state = createEditorState(createPageRoot('root'));
  const dragging = editorReducer(state, {
    type: 'set-dragging',
    source: { kind: 'palette', componentType: 'wb.text' },
  });
  const withTarget = editorReducer(dragging, {
    type: 'set-drop-target',
    target: { parentId: 'section-1', index: 0, position: 'inside' },
  });
  assert.deepEqual(withTarget.dragging, { kind: 'palette', componentType: 'wb.text' });
  assert.deepEqual(withTarget.dropTarget, { parentId: 'section-1', index: 0, position: 'inside' });
  const cleared = editorReducer(withTarget, { type: 'clear-drag' });
  assert.equal(cleared.dragging, undefined);
  assert.equal(cleared.dropTarget, undefined);
});

test('commands insert child and update props/style immutably', () => {
  const root = createPageRoot('root');
  const section = createNode('wb.section', 'section-1');
  const inserted = insertChild(root, 'root', section);
  const withProps = updateNodeProps(inserted, 'section-1', { label: 'Hero' });
  const withStyle = updateNodeStyle(withProps, 'section-1', 'desktop', {
    spacing: { paddingTop: '80px' },
  });

  assert.equal(findNode(root, 'section-1'), undefined);
  assert.equal(findNode(withProps, 'section-1')?.props.label, 'Hero');
  assert.equal(findNode(withStyle, 'section-1')?.responsive?.desktop?.spacing?.paddingTop, '80px');
});

test('remove command never removes the root node', () => {
  const root = createPageRoot('root');
  const section = createNode('wb.section', 'section-1');
  const inserted = insertChild(root, 'root', section);
  assert.equal(findNode(removeEditorNode(inserted, 'section-1'), 'section-1'), undefined);
  assert.equal(removeEditorNode(root, 'root'), root);
});

test('delete command deletes the exact requested node and returns its parent for selection', () => {
  const heading = createNode('wb.heading', 'heading-1');
  const text = createNode('wb.text', 'text-1');
  const grid = { ...createNode('wb.grid', 'grid-1'), children: [heading, text] };
  const container = { ...createNode('wb.container', 'container-1'), children: [grid] };
  const root = { ...createPageRoot('root'), children: [container] };

  const result = deleteEditorNode(root, 'text-1');
  assert.equal(result.deleted, true);
  assert.equal(result.parentId, 'grid-1');
  assert.equal(findNode(result.document, 'text-1'), undefined);
  assert.ok(findNode(result.document, 'heading-1'));

  const rootResult = deleteEditorNode(root, 'root');
  assert.equal(rootResult.deleted, false);
  assert.equal(rootResult.document, root);
});
