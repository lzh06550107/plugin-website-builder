import type { WebsiteNode } from '../../../shared/schema';
import { findNode, getParentNode, isDescendant } from '../../../shared/tree';
import type { ComponentRegistry } from '../../registry';

export interface CommandValidationResult {
  valid: boolean;
  reason?: string;
}

export function findInsertionParent(
  document: WebsiteNode,
  registry: ComponentRegistry,
  selectedNodeId: string | undefined,
  childType: string,
) {
  let current = selectedNodeId ? findNode(document, selectedNodeId) : undefined;
  if (!current) current = document;

  while (current) {
    if (registry.canContain(current.type, childType)) return current;
    current = getParentNode(document, current.id);
  }

  return undefined;
}

export function validateMove(
  document: WebsiteNode,
  registry: ComponentRegistry,
  nodeId: string,
  targetParentId: string,
): CommandValidationResult {
  const node = findNode(document, nodeId);
  const target = findNode(document, targetParentId);
  if (!node) return { valid: false, reason: '找不到要移动的组件' };
  if (!target) return { valid: false, reason: '找不到目标容器' };
  if (node.id === document.id) return { valid: false, reason: '根页面不能移动' };
  if (nodeId === targetParentId) return { valid: false, reason: '组件不能移动到自身' };
  if (isDescendant(document, nodeId, targetParentId)) {
    return { valid: false, reason: '组件不能移动到自己的子节点' };
  }
  if (!registry.canContain(target.type, node.type)) {
    return { valid: false, reason: '目标容器不接受该组件' };
  }
  return { valid: true };
}
