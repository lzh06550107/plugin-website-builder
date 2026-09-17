import type { WebsiteNode } from '../../../shared/schema';
import { moveNode } from '../../../shared/tree';
import type { ComponentRegistry } from '../../registry';
import { validateMove } from './validate';

export interface MoveEditorNodeResult {
  document: WebsiteNode;
  moved: boolean;
  reason?: string;
}

export function moveEditorNode(
  document: WebsiteNode,
  registry: ComponentRegistry,
  nodeId: string,
  targetParentId: string,
  targetIndex: number,
): MoveEditorNodeResult {
  const validation = validateMove(document, registry, nodeId, targetParentId);
  if (!validation.valid) {
    return { document, moved: false, reason: validation.reason };
  }

  const nextDocument = moveNode(document, nodeId, targetParentId, targetIndex);
  return {
    document: nextDocument,
    moved: nextDocument !== document,
    reason: nextDocument === document ? '组件位置没有发生变化' : undefined,
  };
}
