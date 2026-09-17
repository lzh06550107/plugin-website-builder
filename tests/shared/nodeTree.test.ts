import { describe, expect, it } from 'vitest';
import type { WebsiteNode } from '../../src/shared/schema/node';
import { findNode, insertChild, removeNode, replaceNode } from '../../src/shared/utils/nodeTree';

const makeTree = (): WebsiteNode => ({
  id: 'root',
  type: 'wb.page',
  props: {},
  style: {},
  children: [
    {
      id: 'section-1',
      type: 'wb.section',
      props: {},
      style: {},
      children: [
        {
          id: 'heading-1',
          type: 'wb.heading',
          props: { text: 'Old' },
          style: {},
          children: [],
        },
      ],
    },
  ],
});

describe('website node tree helpers', () => {
  it('finds nested nodes', () => {
    expect(findNode(makeTree(), 'heading-1')?.props.text).toBe('Old');
  });

  it('replaces a nested node without mutating the original tree', () => {
    const root = makeTree();
    const heading = findNode(root, 'heading-1')!;
    const next = replaceNode(root, { ...heading, props: { text: 'New' } });

    expect(findNode(next, 'heading-1')?.props.text).toBe('New');
    expect(findNode(root, 'heading-1')?.props.text).toBe('Old');
  });

  it('inserts and removes children without mutating the original tree', () => {
    const root = makeTree();
    const button: WebsiteNode = {
      id: 'button-1',
      type: 'wb.button',
      props: { text: 'Go' },
      style: {},
      children: [],
    };

    const inserted = insertChild(root, 'section-1', button);
    const removed = removeNode(inserted, 'heading-1');

    expect(findNode(inserted, 'section-1')?.children).toHaveLength(2);
    expect(findNode(root, 'section-1')?.children).toHaveLength(1);
    expect(findNode(removed, 'heading-1')).toBeUndefined();
    expect(findNode(inserted, 'heading-1')).toBeDefined();
  });
});
