import type { WebsiteNode } from '../../../shared/schema';
import { findNode, insertNodeAt } from '../../../shared/tree';
import type { ComponentRegistry } from '../../registry';
import { findInsertionParent } from './validate';

export interface InsertTarget {
  parentId: string;
  index?: number;
}

export interface InsertComponentResult {
  document: WebsiteNode;
  inserted: boolean;
  parentId?: string;
  reason?: string;
}

export function insertComponent(
  document: WebsiteNode,
  registry: ComponentRegistry,
  selectedNodeId: string | undefined,
  node: WebsiteNode,
  target?: InsertTarget,
): InsertComponentResult {
  let parent: WebsiteNode | undefined;
  let index: number | undefined;

  if (target) {
    parent = findNode(document, target.parentId);
    if (!parent) return { document, inserted: false, reason: '找不到目标容器' };
    if (!registry.canContain(parent.type, node.type)) {
      return { document, inserted: false, reason: '目标容器不接受该组件' };
    }
    index = target.index;
  } else {
    parent = findInsertionParent(document, registry, selectedNodeId, node.type);
    if (!parent) return { document, inserted: false, reason: '当前层级没有可插入该组件的位置' };
  }

  const targetIndex = index ?? parent.children.length;
  return {
    document: insertNodeAt(document, parent.id, node, targetIndex),
    inserted: true,
    parentId: parent.id,
  };
}
