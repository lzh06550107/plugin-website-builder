import test from 'node:test';
import assert from 'node:assert/strict';
import { createNode, createPageRoot } from '../schema';
import { componentRegistry } from '../../client/registry';
import {
  parseDragSource,
  resolveDropTarget,
  resolveLayerTreeDropTarget,
  serializeDragSource,
  validateDropSource,
} from '../../client/editor/dnd';

test('serializes and parses palette and node drag sources', () => {
  const palette = { kind: 'palette' as const, componentType: 'wb.text' };
  const node = { kind: 'node' as const, nodeId: 'text-1' };
  assert.deepEqual(parseDragSource(serializeDragSource(palette)), palette);
  assert.deepEqual(parseDragSource(serializeDragSource(node)), node);
  assert.equal(parseDragSource('{bad json'), undefined);
});

test('resolves before inside and after canvas drop targets', () => {
  const base = {
    nodeId: 'container-1',
    parentId: 'section-1',
    index: 2,
    childCount: 3,
    acceptsChildren: true,
  };

  assert.deepEqual(resolveDropTarget({ ...base, pointerRatio: 0.1 }), {
    parentId: 'section-1',
    index: 2,
    position: 'before',
    anchorNodeId: 'container-1',
  });
  assert.deepEqual(resolveDropTarget({ ...base, pointerRatio: 0.5 }), {
    parentId: 'container-1',
    index: 3,
    position: 'inside',
    anchorNodeId: 'container-1',
  });
  assert.deepEqual(resolveDropTarget({ ...base, pointerRatio: 0.9 }), {
    parentId: 'section-1',
    index: 3,
    position: 'after',
    anchorNodeId: 'container-1',
  });
});

test('resolves layer tree gap and inside targets to the same parent/index model', () => {
  const base = {
    anchorNodeId: 'text-1',
    parentId: 'container-1',
    index: 1,
    childCount: 0,
  };
  assert.deepEqual(resolveLayerTreeDropTarget({ ...base, dropToGap: true, relativePosition: -1 }), {
    parentId: 'container-1',
    index: 1,
    position: 'before',
    anchorNodeId: 'text-1',
  });
  assert.deepEqual(resolveLayerTreeDropTarget({ ...base, dropToGap: true, relativePosition: 1 }), {
    parentId: 'container-1',
    index: 2,
    position: 'after',
    anchorNodeId: 'text-1',
  });
  assert.deepEqual(resolveLayerTreeDropTarget({ ...base, dropToGap: false, relativePosition: 0 }), {
    parentId: 'text-1',
    index: 0,
    position: 'inside',
    anchorNodeId: 'text-1',
  });
});

test('validates palette and existing-node drops against registry hierarchy', () => {
  const heading = createNode('wb.heading', 'heading-1');
  const container = { ...createNode('wb.container', 'container-1'), children: [heading] };
  const section = { ...createNode('wb.section', 'section-1'), children: [container] };
  const root = { ...createPageRoot('root'), children: [section] };

  assert.equal(
    validateDropSource(root, componentRegistry, { kind: 'palette', componentType: 'wb.text' }, {
      parentId: 'container-1', index: 1, position: 'inside',
    }).valid,
    true,
  );
  assert.equal(
    validateDropSource(root, componentRegistry, { kind: 'palette', componentType: 'wb.text' }, {
      parentId: 'root', index: 0, position: 'inside',
    }).valid,
    false,
  );
  assert.equal(
    validateDropSource(root, componentRegistry, { kind: 'node', nodeId: 'container-1' }, {
      parentId: 'container-1', index: 0, position: 'inside',
    }).valid,
    false,
  );
});
