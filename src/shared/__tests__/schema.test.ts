import test from 'node:test';
import assert from 'node:assert/strict';
import { createNode, createPageRoot, validateWebsiteNode } from '../schema';
import { findNode, insertNode, removeNode, updateNode } from '../tree';

test('creates a valid wb.page root', () => {
  const root = createPageRoot('root');
  assert.equal(root.id, 'root');
  assert.equal(root.type, 'wb.page');
  assert.deepEqual(root.children, []);
  assert.deepEqual(validateWebsiteNode(root), { valid: true, errors: [] });
});

test('rejects component types outside wb namespace', () => {
  const node = { ...createNode('wb.text', 'text-1'), type: 'text' };
  const result = validateWebsiteNode(node);
  assert.equal(result.valid, false);
  assert.match(result.errors[0], /wb\./);
});

test('finds, updates, inserts and removes nodes immutably', () => {
  const heading = createNode('wb.heading', 'heading-1', { text: 'Old' });
  const section = { ...createNode('wb.section', 'section-1'), children: [heading] };
  const root = { ...createPageRoot('root'), children: [section] };

  assert.equal(findNode(root, 'heading-1')?.props.text, 'Old');

  const updated = updateNode(root, 'heading-1', (node) => ({
    ...node,
    props: { ...node.props, text: 'New' },
  }));
  assert.equal(findNode(updated, 'heading-1')?.props.text, 'New');
  assert.equal(findNode(root, 'heading-1')?.props.text, 'Old');

  const button = createNode('wb.button', 'button-1', { text: 'Go' });
  const inserted = insertNode(updated, 'section-1', button);
  assert.equal(findNode(inserted, 'button-1')?.props.text, 'Go');

  const removed = removeNode(inserted, 'heading-1');
  assert.equal(findNode(removed, 'heading-1'), undefined);
  assert.ok(findNode(inserted, 'heading-1'));
});
