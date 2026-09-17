import test from 'node:test';
import assert from 'node:assert/strict';
import { createNode, createPageRoot } from '../schema';
import { findNode } from '../tree';
import { convertLegacySection } from '../../client/editor/commands';

test('converts legacy Section -> Container -> content into strict Container -> Grid -> content', () => {
  const heading = createNode('wb.heading', 'heading-1', { text: 'Hero' });
  const text = createNode('wb.text', 'text-1', { text: 'Body' });
  const legacyContainer = {
    ...createNode('wb.container', 'legacy-container'),
    style: { background: { color: '#fff' } },
    responsive: { mobile: { spacing: { paddingTop: '12px' } } },
    children: [heading, text],
  };
  const legacySection = {
    ...createNode('wb.section', 'section-1'),
    style: { spacing: { paddingTop: '40px' } },
    responsive: { desktop: { layout: { minHeight: '320px' } } },
    children: [legacyContainer],
  };
  const root = { ...createPageRoot('root'), children: [legacySection] };

  const result = convertLegacySection(root, 'section-1');

  assert.equal(result.converted, true);
  assert.equal(result.nodeId, 'section-1');
  const container = findNode(result.document, 'section-1');
  assert.equal(container?.type, 'wb.container');
  assert.equal(container?.style.spacing?.paddingTop, '40px');
  assert.equal(container?.responsive?.desktop?.layout?.minHeight, '320px');
  assert.equal(container?.children.length, 1);

  const grid = findNode(result.document, 'legacy-container');
  assert.equal(grid?.type, 'wb.grid');
  assert.equal(grid?.style.background?.color, '#fff');
  assert.equal(grid?.responsive?.mobile?.spacing?.paddingTop, '12px');
  assert.equal(grid?.props.columns, 1);
  assert.deepEqual(grid?.children.map((child) => child.id), ['heading-1', 'text-1']);
});

test('wraps direct legacy Section content in a generated one-column Grid', () => {
  const legacySection = {
    ...createNode('wb.section', 'section-direct'),
    children: [
      createNode('wb.heading', 'heading-2'),
      createNode('wb.button', 'button-1'),
    ],
  };
  const root = { ...createPageRoot('root'), children: [legacySection] };

  const result = convertLegacySection(root, 'section-direct');
  const container = findNode(result.document, 'section-direct');

  assert.equal(result.converted, true);
  assert.equal(container?.type, 'wb.container');
  assert.equal(container?.children.length, 1);
  assert.equal(container?.children[0].type, 'wb.grid');
  assert.equal(container?.children[0].props.columns, 1);
  assert.deepEqual(container?.children[0].children.map((child) => child.id), ['heading-2', 'button-1']);
});

test('keeps existing grids and rejects non-Section nodes without mutation', () => {
  const grid = {
    ...createNode('wb.grid', 'grid-1'),
    children: [createNode('wb.text', 'text-2')],
  };
  const legacySection = { ...createNode('wb.section', 'section-grid'), children: [grid] };
  const root = { ...createPageRoot('root'), children: [legacySection] };

  const converted = convertLegacySection(root, 'section-grid');
  assert.equal(converted.converted, true);
  assert.equal(findNode(converted.document, 'grid-1')?.type, 'wb.grid');

  const rejected = convertLegacySection(converted.document, 'grid-1');
  assert.equal(rejected.converted, false);
  assert.equal(rejected.document, converted.document);
  assert.match(rejected.reason || '', /Section/);
});
