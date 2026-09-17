import type { DeviceType, WebsiteNode, WebsiteStyle } from '../../../shared/schema';
import { findNodeLocation, insertNode, removeNode, updateNode } from '../../../shared/tree';

export * from './insert';
export * from './move';
export * from './validate';
export * from './migrate';
export * from './contextActions';

function mergeWebsiteStyle(base: Partial<WebsiteStyle> = {}, patch: Partial<WebsiteStyle> = {}): WebsiteStyle {
  return {
    layout: { ...base.layout, ...patch.layout },
    spacing: { ...base.spacing, ...patch.spacing },
    typography: { ...base.typography, ...patch.typography },
    background: { ...base.background, ...patch.background },
    border: { ...base.border, ...patch.border },
  };
}

export function insertChild(document: WebsiteNode, parentId: string, child: WebsiteNode) {
  return insertNode(document, parentId, child);
}

export function removeEditorNode(document: WebsiteNode, nodeId: string) {
  if (document.id === nodeId) return document;
  return removeNode(document, nodeId);
}

export function deleteEditorNode(document: WebsiteNode, nodeId: string) {
  if (document.id === nodeId) {
    return { document, deleted: false, reason: '根页面不能删除' };
  }

  const location = findNodeLocation(document, nodeId);
  if (!location?.parentId) {
    return { document, deleted: false, reason: '找不到要删除的组件' };
  }

  const nextDocument = removeNode(document, nodeId);
  if (nextDocument === document) {
    return { document, deleted: false, reason: '组件没有被删除' };
  }

  return {
    document: nextDocument,
    deleted: true,
    parentId: location.parentId,
  };
}

export function updateNodeProps(document: WebsiteNode, nodeId: string, patch: Record<string, unknown>) {
  return updateNode(document, nodeId, (node) => ({
    ...node,
    props: { ...node.props, ...patch },
  }));
}

export function updateNodeBaseStyle(document: WebsiteNode, nodeId: string, patch: Partial<WebsiteStyle>) {
  return updateNode(document, nodeId, (node) => ({
    ...node,
    style: mergeWebsiteStyle(node.style, patch),
  }));
}

export function updateNodeStyle(
  document: WebsiteNode,
  nodeId: string,
  device: DeviceType,
  patch: Partial<WebsiteStyle>,
) {
  return updateNode(document, nodeId, (node) => ({
    ...node,
    responsive: {
      ...node.responsive,
      [device]: mergeWebsiteStyle(node.responsive?.[device], patch),
    },
  }));
}
