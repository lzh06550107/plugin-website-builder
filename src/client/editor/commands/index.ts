import type { DeviceType, WebsiteNode, WebsiteStyle } from '../../../shared/schema';
import { insertNode, removeNode, updateNode } from '../../../shared/tree';

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
