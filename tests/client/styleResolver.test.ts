import { describe, expect, it } from 'vitest';
import type { WebsiteNode } from '../../src/shared/schema/node';
import { resolveNodeStyle } from '../../src/client/renderer/styleResolver';

const node: WebsiteNode = {
  id: 'heading-1',
  type: 'wb.heading',
  props: {},
  style: {
    typography: { color: '#111', fontSize: '32px', fontWeight: 600 },
    spacing: { marginTop: '8px' },
  },
  responsive: {
    mobile: {
      typography: { fontSize: '20px' },
      spacing: { marginTop: '4px' },
    },
  },
  children: [],
};

describe('resolveNodeStyle', () => {
  it('preserves base style on desktop', () => {
    expect(resolveNodeStyle(node, 'desktop')).toMatchObject({
      color: '#111',
      fontSize: '32px',
      fontWeight: 600,
      marginTop: '8px',
    });
  });

  it('merges mobile overrides without dropping other base fields', () => {
    expect(resolveNodeStyle(node, 'mobile')).toMatchObject({
      color: '#111',
      fontSize: '20px',
      fontWeight: 600,
      marginTop: '4px',
    });
  });
});
