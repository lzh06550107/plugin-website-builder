import type { WebsiteNode } from '../../../shared/schema';
import { findNode, updateNode } from '../../../shared/tree';

export interface InlineImagePatch {
  src: string;
  alt: string;
}

export interface InlineImageEditResult {
  document: WebsiteNode;
  updated: boolean;
  reason?: string;
}

export function updateInlineImage(
  document: WebsiteNode,
  nodeId: string,
  patch: InlineImagePatch,
): InlineImageEditResult {
  const node = findNode(document, nodeId);
  if (!node) return { document, updated: false, reason: '找不到要编辑的图片组件' };
  if (node.type !== 'wb.image') {
    return { document, updated: false, reason: '该组件不是图片组件' };
  }

  const currentSrc = String(node.props.src ?? '');
  const currentAlt = String(node.props.alt ?? '');
  if (currentSrc === patch.src && currentAlt === patch.alt) {
    return { document, updated: false, reason: '图片内容没有变化' };
  }

  return {
    document: updateNode(document, nodeId, (current) => ({
      ...current,
      props: {
        ...current.props,
        src: patch.src,
        alt: patch.alt,
      },
    })),
    updated: true,
  };
}
