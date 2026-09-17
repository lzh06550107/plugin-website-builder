import test from 'node:test';
import assert from 'node:assert/strict';
import { createNode, createPageRoot } from '../schema';
import { insertNode } from '../tree';
import { updateInlineText } from '../../client/editor/commands';

test('inline text edit updates Heading text and preserves other props', () => {
  const root = createPageRoot('root');
  const heading = createNode('wb.heading', 'heading-1', { text: 'Old', level: 3 });
  const document = insertNode(root, 'root', heading);

  const result = updateInlineText(document, 'heading-1', 'New title');

  assert.equal(result.updated, true);
  assert.equal(result.document.children[0].props.text, 'New title');
  assert.equal(result.document.children[0].props.level, 3);
});

test('inline text edit updates Text', () => {
  const root = createPageRoot('root');
  const text = createNode('wb.text', 'text-1', { text: 'Old paragraph' });
  const document = insertNode(root, 'root', text);

  const result = updateInlineText(document, 'text-1', 'New paragraph');

  assert.equal(result.updated, true);
  assert.equal(result.document.children[0].props.text, 'New paragraph');
});

test('inline text edit updates Button label and preserves href', () => {
  const root = createPageRoot('root');
  const button = createNode('wb.button', 'button-1', { text: 'Button label', href: '/demo' });
  const document = insertNode(root, 'root', button);

  const result = updateInlineText(document, 'button-1', 'Changed label');

  assert.equal(result.updated, true);
  assert.equal(result.document.children[0].props.text, 'Changed label');
  assert.equal(result.document.children[0].props.href, '/demo');
});
