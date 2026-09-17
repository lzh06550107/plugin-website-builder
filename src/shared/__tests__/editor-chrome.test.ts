import test from 'node:test';
import assert from 'node:assert/strict';
import { createNode } from '../schema';
import { resolveEditorChromeStyle } from '../../client/renderer/editorChrome';

test('empty layout node receives editor-only minimum height without selected solid outline', () => {
  const container = createNode('wb.container', 'container-1');

  const editorStyle = resolveEditorChromeStyle(container, {}, {
    editing: true,
    acceptsChildren: true,
    selected: true,
  });
  assert.equal(editorStyle.minHeight, '160px');
  assert.equal(editorStyle.outline, undefined);
  assert.equal(editorStyle.outlineOffset, undefined);

  const publishedStyle = resolveEditorChromeStyle(container, {}, {
    editing: false,
    acceptsChildren: true,
    selected: false,
  });
  assert.equal(publishedStyle.minHeight, undefined);
  assert.equal(publishedStyle.outline, undefined);
});

test('configured minimum height is preserved in editor', () => {
  const container = createNode('wb.container', 'container-2');
  const style = resolveEditorChromeStyle(container, { minHeight: '320px' }, {
    editing: true,
    acceptsChildren: true,
    selected: false,
  });
  assert.equal(style.minHeight, '320px');
});

test('non-empty container is not forced to editor minimum height', () => {
  const container = createNode('wb.container', 'container-3');
  container.children.push(createNode('wb.grid', 'grid-1'));
  const style = resolveEditorChromeStyle(container, {}, {
    editing: true,
    acceptsChildren: true,
    selected: false,
  });
  assert.equal(style.minHeight, undefined);
});

test('page keeps a usable editor canvas height even after children are added', () => {
  const page = createNode('wb.page', 'page-root');
  page.children.push(createNode('wb.container', 'container-4'));
  const style = resolveEditorChromeStyle(page, {}, {
    editing: true,
    acceptsChildren: true,
    selected: false,
  });
  assert.equal(style.minHeight, '640px');
});
