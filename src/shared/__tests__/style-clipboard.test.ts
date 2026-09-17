import test from 'node:test';
import assert from 'node:assert/strict';
import { createNode, createPageRoot } from '../schema';
import { findNode } from '../tree';
import { copyEditorNodeStyle, pasteEditorNodeStyle } from '../../client/editor/commands';

function buildDocument() {
  const root = createPageRoot('page-root');
  const container = createNode('wb.container', 'container-1');
  const grid = createNode('wb.grid', 'grid-1');
  const source = createNode('wb.button', 'button-source', { text: 'Source', href: '/source' });
  const target = createNode('wb.button', 'button-target', { text: 'Target', href: '/target' });

  source.style = {
    spacing: { paddingTop: '12px', paddingRight: '20px', paddingBottom: '12px', paddingLeft: '20px' },
    typography: { color: '#ffffff', fontSize: '16px' },
    background: { color: '#1677ff' },
    border: { radius: '8px' },
  };
  source.responsive = {
    desktop: { layout: { width: '180px' } },
    mobile: { layout: { width: '100%' }, typography: { textAlign: 'center' } },
  };

  target.style = { typography: { color: '#111111' } };
  target.responsive = { mobile: { layout: { width: '80%' } } };

  grid.children = [source, target];
  container.children = [grid];
  root.children = [container];
  return root;
}

test('copies only style and responsive values into an editor style clipboard', () => {
  const document = buildDocument();
  const result = copyEditorNodeStyle(document, 'button-source');

  assert.equal(result.copied, true);
  assert.equal(result.clipboard?.sourceType, 'wb.button');
  assert.deepEqual(result.clipboard?.style, findNode(document, 'button-source')?.style);
  assert.deepEqual(result.clipboard?.responsive, findNode(document, 'button-source')?.responsive);
});

test('pastes copied style without changing target identity props or children', () => {
  const document = buildDocument();
  const copied = copyEditorNodeStyle(document, 'button-source');
  assert.ok(copied.clipboard);

  const result = pasteEditorNodeStyle(document, 'button-target', copied.clipboard);
  const target = findNode(result.document, 'button-target');

  assert.equal(result.pasted, true);
  assert.equal(target?.id, 'button-target');
  assert.equal(target?.type, 'wb.button');
  assert.equal(target?.props.text, 'Target');
  assert.equal(target?.props.href, '/target');
  assert.deepEqual(target?.children, []);
  assert.deepEqual(target?.style, copied.clipboard.style);
  assert.deepEqual(target?.responsive, copied.clipboard.responsive);
});

test('copy and paste fail safely when the requested target node does not exist', () => {
  const document = buildDocument();
  const copied = copyEditorNodeStyle(document, 'missing');
  assert.equal(copied.copied, false);

  const source = copyEditorNodeStyle(document, 'button-source');
  assert.ok(source.clipboard);
  const pasted = pasteEditorNodeStyle(document, 'missing', source.clipboard);
  assert.equal(pasted.pasted, false);
  assert.equal(pasted.document, document);
});
