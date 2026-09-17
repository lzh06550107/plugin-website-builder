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
  'wb.container': '96px',
  'wb.grid': '96px',
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

  if (options.selected) {
    style.outline = '2px solid #1677ff';
    style.outlineOffset = '-2px';
  }

  return style;
}

export function getEmptyNodeHint(type: string) {
  switch (type) {
    case 'wb.page':
      return '空页面 · 从左侧添加 Section';
    case 'wb.section':
      return '空 Section · 从左侧添加 Container、Grid 或内容组件';
    case 'wb.container':
      return '空 Container · 从左侧添加组件';
    case 'wb.grid':
      return '空 Grid · 从左侧添加组件';
    default:
      return '从左侧添加组件';
  }
}
