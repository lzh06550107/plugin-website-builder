import type { DeviceType, WebsiteNode } from '../../../shared/schema';

export interface WebsiteEditorState {
  document: WebsiteNode;
  selectedNodeId?: string;
  device: DeviceType;
  dirty: boolean;
}

export type WebsiteEditorAction =
  | { type: 'select'; nodeId?: string }
  | { type: 'set-device'; device: DeviceType }
  | { type: 'replace-document'; document: WebsiteNode; markDirty?: boolean }
  | { type: 'mark-saved' };
