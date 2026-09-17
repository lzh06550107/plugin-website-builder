import test from 'node:test';
import assert from 'node:assert/strict';
import { createNode, createPageRoot } from '../schema';
import { findNode } from '../tree';
import { createEditorState, editorReducer } from '../../client/editor/state';
import { insertChild, removeEditorNode, updateNodeProps, updateNodeStyle } from '../../client/editor/commands';

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
