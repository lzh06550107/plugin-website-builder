import type { WebsiteNode } from '../../../shared/schema';
import type { WebsiteEditorAction, WebsiteEditorState } from './types';

export function createEditorState(document: WebsiteNode): WebsiteEditorState {
  return {
    document,
    selectedNodeId: document.id,
    device: 'desktop',
    dirty: false,
  };
}

export function editorReducer(state: WebsiteEditorState, action: WebsiteEditorAction): WebsiteEditorState {
  switch (action.type) {
    case 'select':
      return { ...state, selectedNodeId: action.nodeId };
    case 'set-device':
      return { ...state, device: action.device };
    case 'replace-document':
      return { ...state, document: action.document, dirty: action.markDirty ?? state.dirty };
    case 'mark-saved':
      return { ...state, dirty: false };
    default:
      return state;
  }
}
