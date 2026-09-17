import test from 'node:test';
import assert from 'node:assert/strict';
import { createNode } from '../schema';
import { resolveNodeStyle } from '../../client/renderer/style';

test('desktop style merges base and desktop overrides', () => {
  const node = createNode('wb.section', 'section-1');
  node.style = {
    layout: { width: '100%', minHeight: '200px' },
    spacing: { paddingTop: '40px' },
    typography: { color: '#111111' },
  };
  node.responsive = {
    desktop: { layout: { minHeight: '320px' } },
  };

  assert.deepEqual(resolveNodeStyle(node, 'desktop'), {
    width: '100%',
    minHeight: '320px',
    paddingTop: '40px',
    color: '#111111',
  });
});

test('mobile style inherits base and only replaces configured values', () => {
  const node = createNode('wb.text', 'text-1');
  node.style = {
    typography: { color: '#111111', fontSize: '18px', lineHeight: 1.6 },
    spacing: { marginBottom: '24px' },
  };
  node.responsive = {
    mobile: {
      typography: { fontSize: '14px' },
      spacing: { marginBottom: '12px' },
    },
  };

  assert.deepEqual(resolveNodeStyle(node, 'mobile'), {
    color: '#111111',
    fontSize: '14px',
    lineHeight: 1.6,
    marginBottom: '12px',
  });
});
