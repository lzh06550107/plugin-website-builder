import type { WebsiteNode } from '../../../shared/schema';
import { findNode, updateNode } from '../../../shared/tree';

const INLINE_TEXT_TYPES = new Set(['wb.heading', 'wb.text', 'wb.button']);

export interface InlineTextEditResult {
  document: WebsiteNode;
  updated: boolean;
  reason?: string;
}

export function canInlineEditText(node?: WebsiteNode) {
  return Boolean(node && INLINE_TEXT_TYPES.has(node.type));
}

export function updateInlineText(document: WebsiteNode, nodeId: string, text: string): InlineTextEditResult {
  const node = findNode(document, nodeId);
  if (!node) return { document, updated: false, reason: '找不到要编辑的组件' };
  if (!canInlineEditText(node)) {
    return { document, updated: false, reason: '该组件暂不支持双击编辑文字' };
  }

  const currentText = String(node.props.text ?? '');
  if (currentText === text) return { document, updated: false, reason: '文字没有变化' };

  return {
    document: updateNode(document, nodeId, (current) => ({
      ...current,
      props: { ...current.props, text },
    })),
    updated: true,
  };
}
