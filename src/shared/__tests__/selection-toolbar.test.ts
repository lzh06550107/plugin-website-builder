import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSelectionToolbarPlacement } from '../../client/editor/canvas/selectionToolbar';

test('selection toolbar prefers the space above the selected node', () => {
  const placement = resolveSelectionToolbarPlacement(
    { left: 100, top: 100, width: 800, height: 600 },
    { left: 240, top: 260, width: 320, height: 80 },
    { width: 220, height: 32 },
  );

  assert.deepEqual(placement, { left: 140, top: 122, side: 'above' });
});

test('selection toolbar falls below a node near the top edge', () => {
  const placement = resolveSelectionToolbarPlacement(
    { left: 100, top: 100, width: 800, height: 600 },
    { left: 240, top: 108, width: 320, height: 60 },
    { width: 220, height: 32 },
  );

  assert.deepEqual(placement, { left: 140, top: 74, side: 'below' });
});

test('selection toolbar is clamped inside the frame horizontally', () => {
  const placement = resolveSelectionToolbarPlacement(
    { left: 100, top: 100, width: 400, height: 500 },
    { left: 430, top: 260, width: 80, height: 60 },
    { width: 220, height: 32 },
  );

  assert.deepEqual(placement, { left: 176, top: 122, side: 'above' });
});
