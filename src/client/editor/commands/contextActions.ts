import type { ResponsiveStyle, WebsiteNode, WebsiteStyle } from '../../../shared/schema';
import { findNode, findNodeLocation, insertNodeAt, reorderNode, updateNode } from '../../../shared/tree';

export type RelativeMoveDirection = 'up' | 'down';
export type NodeIdFactory = (node: WebsiteNode) => string;

export interface DuplicateEditorNodeResult {
  document: WebsiteNode;
  duplicated: boolean;
  nodeId?: string;
  parentId?: string;
  reason?: string;
}

export interface RelativeMoveResult {
  document: WebsiteNode;
  moved: boolean;
  nodeId?: string;
  parentId?: string;
  reason?: string;
}

export interface WebsiteNodeStyleClipboard {
  sourceNodeId: string;
  sourceType: string;
  style: WebsiteStyle;
  responsive?: ResponsiveStyle;
}

export interface CopyEditorNodeStyleResult {
  copied: boolean;
  clipboard?: WebsiteNodeStyleClipboard;
  reason?: string;
}

export interface PasteEditorNodeStyleResult {
  document: WebsiteNode;
  pasted: boolean;
  nodeId?: string;
  reason?: string;
}

function cloneStyle(style: WebsiteStyle = {}): WebsiteStyle {
  const cloned: WebsiteStyle = {};
  if (style.layout) cloned.layout = { ...style.layout };
  if (style.spacing) cloned.spacing = { ...style.spacing };
  if (style.typography) cloned.typography = { ...style.typography };
  if (style.background) cloned.background = { ...style.background };
  if (style.border) cloned.border = { ...style.border };
  return cloned;
}

function cloneResponsive(responsive?: ResponsiveStyle): ResponsiveStyle | undefined {
  if (!responsive) return undefined;
  const cloned: ResponsiveStyle = {};
  if (responsive.desktop) cloned.desktop = cloneStyle(responsive.desktop);
  if (responsive.mobile) cloned.mobile = cloneStyle(responsive.mobile);
  return cloned;
}

function cloneNode(node: WebsiteNode, idFactory: NodeIdFactory, usedIds: Set<string>): WebsiteNode {
  const id = idFactory(node);
  if (!id || usedIds.has(id)) throw new Error('复制组件生成了重复的节点 ID');
  usedIds.add(id);

  return {
    ...node,
    id,
    props: { ...node.props },
    style: cloneStyle(node.style),
    responsive: cloneResponsive(node.responsive),
    children: node.children.map((child) => cloneNode(child, idFactory, usedIds)),
  };
}

function collectIds(node: WebsiteNode, ids: Set<string>) {
  ids.add(node.id);
  node.children.forEach((child) => collectIds(child, ids));
}

export function duplicateEditorNode(
  document: WebsiteNode,
  nodeId: string,
  idFactory: NodeIdFactory,
): DuplicateEditorNodeResult {
  if (nodeId === document.id) {
    return { document, duplicated: false, reason: '根页面不能复制' };
  }

  const location = findNodeLocation(document, nodeId);
  if (!location?.parentId) {
    return { document, duplicated: false, reason: '找不到要复制的组件' };
  }

  const usedIds = new Set<string>();
  collectIds(document, usedIds);

  try {
    const copy = cloneNode(location.node, idFactory, usedIds);
    return {
      document: insertNodeAt(document, location.parentId, copy, location.index + 1),
      duplicated: true,
      nodeId: copy.id,
      parentId: location.parentId,
    };
  } catch (error) {
    return {
      document,
      duplicated: false,
      reason: error instanceof Error ? error.message : '复制组件失败',
    };
  }
}

export function moveEditorNodeRelative(
  document: WebsiteNode,
  nodeId: string,
  direction: RelativeMoveDirection,
): RelativeMoveResult {
  if (nodeId === document.id) {
    return { document, moved: false, reason: '根页面不能排序' };
  }

  const location = findNodeLocation(document, nodeId);
  if (!location?.parentId || !location.parent) {
    return { document, moved: false, reason: '找不到要移动的组件' };
  }

  const targetIndex = direction === 'up' ? location.index - 1 : location.index + 1;
  if (targetIndex < 0 || targetIndex >= location.parent.children.length) {
    return { document, moved: false, reason: direction === 'up' ? '已经是第一个组件' : '已经是最后一个组件' };
  }

  const nextDocument = reorderNode(document, location.parentId, location.index, targetIndex);
  if (nextDocument === document) {
    return { document, moved: false, reason: '组件位置没有发生变化' };
  }

  return {
    document: nextDocument,
    moved: true,
    nodeId,
    parentId: location.parentId,
  };
}

export function getSiblingMoveAvailability(document: WebsiteNode, nodeId: string) {
  const location = findNodeLocation(document, nodeId);
  if (!location?.parent) return { canMoveUp: false, canMoveDown: false };
  return {
    canMoveUp: location.index > 0,
    canMoveDown: location.index < location.parent.children.length - 1,
  };
}

export function canDuplicateEditorNode(document: WebsiteNode, nodeId: string) {
  return nodeId !== document.id && Boolean(findNode(document, nodeId));
}

export function copyEditorNodeStyle(document: WebsiteNode, nodeId: string): CopyEditorNodeStyleResult {
  const node = findNode(document, nodeId);
  if (!node) return { copied: false, reason: '找不到要复制样式的组件' };

  return {
    copied: true,
    clipboard: {
      sourceNodeId: node.id,
      sourceType: node.type,
      style: cloneStyle(node.style),
      responsive: cloneResponsive(node.responsive),
    },
  };
}

export function pasteEditorNodeStyle(
  document: WebsiteNode,
  nodeId: string,
  clipboard: WebsiteNodeStyleClipboard,
): PasteEditorNodeStyleResult {
  if (!findNode(document, nodeId)) {
    return { document, pasted: false, reason: '找不到要粘贴样式的组件' };
  }

  const nextDocument = updateNode(document, nodeId, (node) => ({
    ...node,
    style: cloneStyle(clipboard.style),
    responsive: cloneResponsive(clipboard.responsive),
  }));

  return {
    document: nextDocument,
    pasted: true,
    nodeId,
  };
}
