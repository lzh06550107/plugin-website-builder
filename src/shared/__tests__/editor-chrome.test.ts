import test from 'node:test';
import assert from 'node:assert/strict';
import { createNode } from '../schema';
import { resolveEditorChromeStyle } from '../../client/renderer/editorChrome';

test('empty section receives editor-only minimum height', () => {
  const section = createNode('wb.section', 'section-1');

  const editorStyle = resolveEditorChromeStyle(section, {}, {
    editing: true,
    acceptsChildren: true,
    selected: true,
  });
  assert.equal(editorStyle.minHeight, '160px');
  assert.equal(editorStyle.outline, '2px solid #1677ff');

  const publishedStyle = resolveEditorChromeStyle(section, {}, {
    editing: false,
    acceptsChildren: true,
    selected: false,
  });
  assert.equal(publishedStyle.minHeight, undefined);
  assert.equal(publishedStyle.outline, undefined);
});

test('configured minimum height is preserved in editor', () => {
  const section = createNode('wb.section', 'section-2');
  const style = resolveEditorChromeStyle(section, { minHeight: '320px' }, {
    editing: true,
    acceptsChildren: true,
    selected: false,
  });
  assert.equal(style.minHeight, '320px');
});

test('non-empty section is not forced to editor minimum height', () => {
  const section = createNode('wb.section', 'section-3');
  section.children.push(createNode('wb.text', 'text-1'));
  const style = resolveEditorChromeStyle(section, {}, {
    editing: true,
    acceptsChildren: true,
    selected: false,
  });
  assert.equal(style.minHeight, undefined);
});

test('page keeps a usable editor canvas height even after children are added', () => {
  const page = createNode('wb.page', 'page-root');
  page.children.push(createNode('wb.section', 'section-4'));
  const style = resolveEditorChromeStyle(page, {}, {
    editing: true,
    acceptsChildren: true,
    selected: false,
  });
  assert.equal(style.minHeight, '640px');
});
