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

test('inline text edit updates Text but rejects non-text components', () => {
  const root = createPageRoot('root');
  const text = createNode('wb.text', 'text-1', { text: 'Old paragraph' });
  const button = createNode('wb.button', 'button-1', { text: 'Button label', href: '/demo' });
  const withText = insertNode(root, 'root', text);
  const document = insertNode(withText, 'root', button);

  const textResult = updateInlineText(document, 'text-1', 'New paragraph');
  assert.equal(textResult.updated, true);
  assert.equal(textResult.document.children[0].props.text, 'New paragraph');

  const buttonResult = updateInlineText(document, 'button-1', 'Changed');
  assert.equal(buttonResult.updated, false);
  assert.equal(buttonResult.document, document);
  assert.equal(buttonResult.document.children[1].props.text, 'Button label');
});
