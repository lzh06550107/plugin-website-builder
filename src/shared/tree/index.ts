import type { WebsiteNode } from '../schema';

export function findNode(root: WebsiteNode, id: string): WebsiteNode | undefined {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return undefined;
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
