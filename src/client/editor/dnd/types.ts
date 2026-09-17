export type DragSource =
  | { kind: 'palette'; componentType: string }
  | { kind: 'node'; nodeId: string };

export type DropPosition = 'before' | 'inside' | 'after';

export interface DropTarget {
  parentId: string;
  index: number;
  position: DropPosition;
  anchorNodeId?: string;
}

export interface NodeDropGeometry {
  nodeId: string;
  parentId?: string;
  index: number;
  childCount: number;
  acceptsChildren: boolean;
  pointerRatio: number;
}

export interface DropValidationResult {
  valid: boolean;
  reason?: string;
}
