import type { WebsiteNode } from '../schema/node';

export function findNode(root: WebsiteNode, nodeId: string): WebsiteNode | undefined {
  if (root.id === nodeId) {
    return root;
  }

  for (const child of root.children) {
    const found = findNode(child, nodeId);
    if (found) {
      return found;
    }
  }

  return undefined;
}

export function replaceNode(root: WebsiteNode, node: WebsiteNode): WebsiteNode {
  if (root.id === node.id) {
    return node;
  }

  let changed = false;
  const children = root.children.map((child) => {
    const next = replaceNode(child, node);
    if (next !== child) {
      changed = true;
    }
    return next;
  });

  return changed ? { ...root, children } : root;
}

export function insertChild(
  root: WebsiteNode,
  parentId: string,
  child: WebsiteNode,
  index?: number,
): WebsiteNode {
  if (root.id === parentId) {
    const children = [...root.children];
    const targetIndex = index == null ? children.length : Math.max(0, Math.min(index, children.length));
    children.splice(targetIndex, 0, child);
    return { ...root, children };
  }

  let changed = false;
  const children = root.children.map((current) => {
    const next = insertChild(current, parentId, child, index);
    if (next !== current) {
      changed = true;
    }
    return next;
  });

  return changed ? { ...root, children } : root;
}

export function removeNode(root: WebsiteNode, nodeId: string): WebsiteNode {
  let changed = false;
  const children: WebsiteNode[] = [];

  for (const child of root.children) {
    if (child.id === nodeId) {
      changed = true;
      continue;
    }

    const next = removeNode(child, nodeId);
    if (next !== child) {
      changed = true;
    }
    children.push(next);
  }

  return changed ? { ...root, children } : root;
}

export function updateNode(
  root: WebsiteNode,
  nodeId: string,
  updater: (node: WebsiteNode) => WebsiteNode,
): WebsiteNode {
  const node = findNode(root, nodeId);
  return node ? replaceNode(root, updater(node)) : root;
}
