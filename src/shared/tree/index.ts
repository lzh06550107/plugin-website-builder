import type { WebsiteNode } from '../schema';

export interface WebsiteNodeLocation {
  node: WebsiteNode;
  parent?: WebsiteNode;
  parentId?: string;
  index: number;
}

export function findNode(root: WebsiteNode, id: string): WebsiteNode | undefined {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return undefined;
}

export function findNodeLocation(root: WebsiteNode, id: string): WebsiteNodeLocation | undefined {
  if (root.id === id) return { node: root, index: -1 };
  for (let index = 0; index < root.children.length; index += 1) {
    const child = root.children[index];
    if (child.id === id) {
      return { node: child, parent: root, parentId: root.id, index };
    }
    const nested = findNodeLocation(child, id);
    if (nested) return nested;
  }
  return undefined;
}

export function getParentNode(root: WebsiteNode, id: string): WebsiteNode | undefined {
  return findNodeLocation(root, id)?.parent;
}

export function getAncestorIds(root: WebsiteNode, id: string): string[] {
  if (root.id === id) return [];
  for (const child of root.children) {
    if (child.id === id) return [root.id];
    const nested = getAncestorIds(child, id);
    if (nested.length > 0) return [root.id, ...nested];
  }
  return [];
}

export function isDescendant(root: WebsiteNode, ancestorId: string, candidateId: string): boolean {
  const ancestor = findNode(root, ancestorId);
  if (!ancestor || ancestorId === candidateId) return false;
  return ancestor.children.some((child) => child.id === candidateId || isDescendant(child, child.id, candidateId));
}

export function updateNode(root: WebsiteNode, id: string, updater: (node: WebsiteNode) => WebsiteNode): WebsiteNode {
  if (root.id === id) return updater(root);
  let changed = false;
  const children = root.children.map((child) => {
    const next = updateNode(child, id, updater);
    if (next !== child) changed = true;
    return next;
  });
  return changed ? { ...root, children } : root;
}

export function insertNode(root: WebsiteNode, parentId: string, node: WebsiteNode): WebsiteNode {
  return updateNode(root, parentId, (parent) => ({ ...parent, children: [...parent.children, node] }));
}

export function insertNodeAt(root: WebsiteNode, parentId: string, node: WebsiteNode, index: number): WebsiteNode {
  return updateNode(root, parentId, (parent) => {
    const nextIndex = Math.max(0, Math.min(index, parent.children.length));
    const children = [...parent.children];
    children.splice(nextIndex, 0, node);
    return { ...parent, children };
  });
}

export function removeNode(root: WebsiteNode, id: string): WebsiteNode {
  let changed = false;
  const filtered = root.children.filter((child) => {
    if (child.id === id) {
      changed = true;
      return false;
    }
    return true;
  });
  const children = filtered.map((child) => {
    const next = removeNode(child, id);
    if (next !== child) changed = true;
    return next;
  });
  return changed ? { ...root, children } : root;
}

export function reorderNode(root: WebsiteNode, parentId: string, fromIndex: number, toIndex: number): WebsiteNode {
  return updateNode(root, parentId, (parent) => {
    if (fromIndex < 0 || fromIndex >= parent.children.length) return parent;
    const children = [...parent.children];
    const [node] = children.splice(fromIndex, 1);
    const nextIndex = Math.max(0, Math.min(toIndex, children.length));
    children.splice(nextIndex, 0, node);
    return { ...parent, children };
  });
}

export function moveNode(root: WebsiteNode, nodeId: string, targetParentId: string, targetIndex: number): WebsiteNode {
  const source = findNodeLocation(root, nodeId);
  if (!source?.parentId) return root;
  if (!findNode(root, targetParentId)) return root;

  if (source.parentId === targetParentId) {
    const adjustedIndex = source.index < targetIndex ? targetIndex - 1 : targetIndex;
    return reorderNode(root, source.parentId, source.index, adjustedIndex);
  }

  const withoutSource = removeNode(root, nodeId);
  return insertNodeAt(withoutSource, targetParentId, source.node, targetIndex);
}
