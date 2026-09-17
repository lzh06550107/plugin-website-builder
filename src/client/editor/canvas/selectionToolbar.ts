export interface ToolbarRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface SelectionToolbarPlacement {
  left: number;
  top: number;
  side: 'above' | 'below';
}

const EDGE_GAP = 4;
const NODE_GAP = 6;

export function resolveSelectionToolbarPlacement(
  frame: ToolbarRect,
  node: ToolbarRect,
  toolbar: Pick<ToolbarRect, 'width' | 'height'>,
): SelectionToolbarPlacement {
  const relativeLeft = node.left - frame.left;
  const relativeTop = node.top - frame.top;
  const maxLeft = Math.max(EDGE_GAP, frame.width - toolbar.width - EDGE_GAP);
  const left = Math.max(EDGE_GAP, Math.min(relativeLeft, maxLeft));

  const aboveTop = relativeTop - toolbar.height - NODE_GAP;
  if (aboveTop >= EDGE_GAP) {
    return { left, top: aboveTop, side: 'above' };
  }

  const belowTop = node.top + node.height - frame.top + NODE_GAP;
  const maxTop = Math.max(EDGE_GAP, frame.height - toolbar.height - EDGE_GAP);
  return {
    left,
    top: Math.max(EDGE_GAP, Math.min(belowTop, maxTop)),
    side: 'below',
  };
}
