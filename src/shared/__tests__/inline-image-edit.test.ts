import test from 'node:test';
import assert from 'node:assert/strict';
import { createNode, createPageRoot } from '../schema';
import { insertNode } from '../tree';
import * as commands from '../../client/editor/commands';

const updateInlineImage = (commands as typeof commands & {
  updateInlineImage?: (
    document: ReturnType<typeof createPageRoot>,
    nodeId: string,
    patch: { src: string; alt: string },
  ) => { document: ReturnType<typeof createPageRoot>; updated: boolean; reason?: string };
}).updateInlineImage;

test('inline image replacement updates src and alt while preserving other node data', () => {
  assert.equal(typeof updateInlineImage, 'function');

  const root = createPageRoot('root');
  const image = createNode('wb.image', 'image-1', { src: '/old.jpg', alt: 'Old image', custom: 'keep' });
  image.style = { border: { radius: '8px' } };
  const document = insertNode(root, 'root', image);

  const result = updateInlineImage!(document, 'image-1', { src: '/new.jpg', alt: 'New image' });

  assert.equal(result.updated, true);
  assert.equal(result.document.children[0].props.src, '/new.jpg');
  assert.equal(result.document.children[0].props.alt, 'New image');
  assert.equal(result.document.children[0].props.custom, 'keep');
  assert.equal(result.document.children[0].style.border?.radius, '8px');
});

test('inline image replacement rejects non-image components', () => {
  assert.equal(typeof updateInlineImage, 'function');

  const root = createPageRoot('root');
  const button = createNode('wb.button', 'button-1', { text: 'Button', href: '/demo' });
  const document = insertNode(root, 'root', button);

  const result = updateInlineImage!(document, 'button-1', { src: '/new.jpg', alt: 'New image' });

  assert.equal(result.updated, false);
  assert.equal(result.document, document);
  assert.equal(result.document.children[0].props.href, '/demo');
});
