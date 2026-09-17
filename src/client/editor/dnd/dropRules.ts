import type { WebsiteNode } from '../../../shared/schema';
import { findNode } from '../../../shared/tree';
import type { ComponentRegistry } from '../../registry';
import { validateMove } from '../commands';
import type { DragSource, DropTarget, DropValidationResult, NodeDropGeometry } from './types';

export function resolveDropTarget(geometry: NodeDropGeometry): DropTarget | undefined {
  const ratio = Math.max(0, Math.min(1, geometry.pointerRatio));

  if (geometry.acceptsChildren && ratio >= 0.25 && ratio <= 0.75) {
    return {
      parentId: geometry.nodeId,
      index: geometry.childCount,
      position: 'inside',
      anchorNodeId: geometry.nodeId,
    };
  }

  if (!geometry.parentId) {
    if (!geometry.acceptsChildren) return undefined;
    return {
      parentId: geometry.nodeId,
      index: geometry.childCount,
      position: 'inside',
      anchorNodeId: geometry.nodeId,
    };
  }

  if (ratio < 0.5) {
    return {
      parentId: geometry.parentId,
      index: geometry.index,
      position: 'before',
      anchorNodeId: geometry.nodeId,
    };
  }

  return {
    parentId: geometry.parentId,
    index: geometry.index + 1,
    position: 'after',
    anchorNodeId: geometry.nodeId,
  };
}

export function validateDropSource(
  document: WebsiteNode,
  registry: ComponentRegistry,
  source: DragSource | undefined,
  target: DropTarget | undefined,
): DropValidationResult {
  if (!source) return { valid: false, reason: '没有拖拽中的组件' };
  if (!target) return { valid: false, reason: '没有有效的放置位置' };

  const parent = findNode(document, target.parentId);
  if (!parent) return { valid: false, reason: '找不到目标容器' };

  if (source.kind === 'palette') {
    return registry.canContain(parent.type, source.componentType)
      ? { valid: true }
      : { valid: false, reason: '目标容器不接受该组件' };
  }

  return validateMove(document, registry, source.nodeId, target.parentId);
}
