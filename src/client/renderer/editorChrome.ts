import type { WebsiteNode } from '../../shared/schema';
import type { ResolvedWebsiteStyle } from './style';

export interface EditorChromeOptions {
  editing: boolean;
  acceptsChildren: boolean;
  selected: boolean;
}

const EMPTY_LAYOUT_MIN_HEIGHT: Record<string, string> = {
  'wb.page': '640px',
  'wb.section': '160px',
  'wb.container': '160px',
  'wb.grid': '120px',
};

function hasMinHeight(style: ResolvedWebsiteStyle) {
  return style.minHeight !== undefined && style.minHeight !== null && style.minHeight !== '';
}

/**
 * Adds editor-only affordances to layout nodes.
 * These styles are never persisted to Website Schema and never affect published rendering.
 */
export function resolveEditorChromeStyle(
  node: WebsiteNode,
  baseStyle: ResolvedWebsiteStyle,
  options: EditorChromeOptions,
): ResolvedWebsiteStyle {
  const style: ResolvedWebsiteStyle = { ...baseStyle };

  if (!options.editing) return style;

  if (node.type === 'wb.page' && !hasMinHeight(style)) {
    style.minHeight = EMPTY_LAYOUT_MIN_HEIGHT['wb.page'];
  } else if (options.acceptsChildren && node.children.length === 0 && !hasMinHeight(style)) {
    style.minHeight = EMPTY_LAYOUT_MIN_HEIGHT[node.type] || '80px';
  }

  // Selection is expressed by the layers tree/property panel. Do not draw a solid
  // outline around the authored page node because it looks like real page content.
  return style;
}

export function getEmptyNodeHint(type: string) {
  switch (type) {
    case 'wb.page':
      return '空页面 · 先添加 Container';
    case 'wb.section':
      return '旧版 Section · 请在右侧转换为新结构';
    case 'wb.container':
      return '空 Container · 添加 Grid';
    case 'wb.grid':
      return '空 Grid · 添加 Heading、Text、Image 或 Button';
    default:
      return '从左侧添加组件';
  }
}
