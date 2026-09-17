import type { WebsiteNode } from '../../../shared/schema';
import { findNode } from '../../../shared/tree';
import type { ComponentRegistry } from '../../registry';
import { validateMove } from '../commands';
import type { DragSource, DropTarget, DropValidationResult, NodeDropGeometry } from './types';

export interface LayerTreeDropGeometry {
  anchorNodeId: string;
  parentId?: string;
  index: number;
  childCount: number;
  dropToGap: boolean;
  relativePosition: number;
}

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

export function resolveLayerTreeDropTarget(geometry: LayerTreeDropGeometry): DropTarget | undefined {
  if (!geometry.dropToGap) {
    return {
      parentId: geometry.anchorNodeId,
      index: geometry.childCount,
      position: 'inside',
      anchorNodeId: geometry.anchorNodeId,
    };
  }

  if (!geometry.parentId) return undefined;
  const after = geometry.relativePosition > 0;
  return {
    parentId: geometry.parentId,
    index: geometry.index + (after ? 1 : 0),
    position: after ? 'after' : 'before',
    anchorNodeId: geometry.anchorNodeId,
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
