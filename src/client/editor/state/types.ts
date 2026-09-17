import type { DeviceType, WebsiteNode } from '../../../shared/schema';
import type { DragSource, DropTarget } from '../dnd';

export interface WebsiteEditorState {
  document: WebsiteNode;
  selectedNodeId?: string;
  device: DeviceType;
  dirty: boolean;
  dragging?: DragSource;
  dropTarget?: DropTarget;
}

export type WebsiteEditorAction =
  | { type: 'select'; nodeId?: string }
  | { type: 'set-device'; device: DeviceType }
  | { type: 'replace-document'; document: WebsiteNode; markDirty?: boolean }
  | { type: 'set-dragging'; source?: DragSource }
  | { type: 'set-drop-target'; target?: DropTarget }
  | { type: 'clear-drag' }
  | { type: 'mark-saved' };
