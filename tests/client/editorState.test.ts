import { describe, expect, it } from 'vitest';
import { createEmptyPageSchema } from '../../src/shared/schema/page';
import { addComponent, removeComponent, updateNodeProps, updateNodeStyleField } from '../../src/client/editor/editorState';
import { findNode } from '../../src/shared/utils/nodeTree';

describe('website editor state', () => {
  it('adds, edits responsively and removes components immutably', () => {
    const original = createEmptyPageSchema('root');
    let schema = addComponent(original, 'root', 'wb.heading', 'heading-1');
    schema = updateNodeProps(schema, 'heading-1', { text: 'Hello' });
    schema = updateNodeStyleField(schema, 'heading-1', 'desktop', 'typography', 'fontSize', '36px');
    schema = updateNodeStyleField(schema, 'heading-1', 'mobile', 'typography', 'fontSize', '20px');

    const heading: any = findNode(schema.root, 'heading-1');
    expect(heading.props.text).toBe('Hello');
    expect(heading.style.typography.fontSize).toBe('36px');
    expect(heading.responsive.mobile.typography.fontSize).toBe('20px');
    expect(original.root.children).toHaveLength(0);

    schema = removeComponent(schema, 'heading-1');
    expect(findNode(schema.root, 'heading-1')).toBeUndefined();
  });
});
