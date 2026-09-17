import type { WebsiteNode } from '../../../shared/schema';
import { createNode } from '../../../shared/schema';
import { findNode, updateNode } from '../../../shared/tree';

const CONTENT_TYPES = new Set(['wb.heading', 'wb.text', 'wb.image', 'wb.button']);

export interface ConvertLegacySectionResult {
  document: WebsiteNode;
  converted: boolean;
  nodeId?: string;
  reason?: string;
  warnings: string[];
}

function isContentNode(node: WebsiteNode) {
  return CONTENT_TYPES.has(node.type);
}

function nextGeneratedGridId(document: WebsiteNode, sectionId: string, start: number) {
  let index = start;
  let candidate = `${sectionId}__grid_${index}`;
  while (findNode(document, candidate)) {
    index += 1;
    candidate = `${sectionId}__grid_${index}`;
  }
  return { id: candidate, nextIndex: index + 1 };
}

function asOneColumnGrid(node: WebsiteNode, children: WebsiteNode[]): WebsiteNode {
  return {
    ...node,
    type: 'wb.grid',
    props: {
      ...node.props,
      columns: typeof node.props.columns === 'number' ? node.props.columns : 1,
    },
    children,
  };
}

function normalizeLayoutChildren(
  document: WebsiteNode,
  sectionId: string,
  nodes: WebsiteNode[],
  warnings: string[],
) {
  const grids: WebsiteNode[] = [];
  let directContent: WebsiteNode[] = [];
  let generatedIndex = 1;

  const flushDirectContent = () => {
    if (directContent.length === 0) return;
    const generated = nextGeneratedGridId(document, sectionId, generatedIndex);
    generatedIndex = generated.nextIndex;
    const grid = createNode('wb.grid', generated.id, { columns: 1 });
    grid.children = directContent;
    grids.push(grid);
    directContent = [];
  };

  const appendNode = (node: WebsiteNode) => {
    if (isContentNode(node)) {
      directContent.push(node);
      return;
    }

    flushDirectContent();

    if (node.type === 'wb.grid') {
      const direct = node.children.filter(isContentNode);
      const nested = node.children.filter((child) => !isContentNode(child));
      if (nested.length === 0) {
        grids.push(node);
        return;
      }

      if (direct.length > 0) grids.push({ ...node, children: direct });
      warnings.push(`Grid ${node.id} 含旧布局子节点，已展开为合法 Grid 结构`);
      nested.forEach(appendNode);
      return;
    }

    if (node.type === 'wb.container') {
      const direct = node.children.filter(isContentNode);
      const nested = node.children.filter((child) => !isContentNode(child));
      if (direct.length > 0 || nested.length === 0) {
        grids.push(asOneColumnGrid(node, direct));
      }
      if (nested.length > 0) {
        if (direct.length === 0) {
          warnings.push(`Container ${node.id} 的布局样式无法作为独立层级保留，子 Grid 已提升`);
        }
        nested.forEach(appendNode);
      }
      return;
    }

    if (node.type === 'wb.section') {
      warnings.push(`嵌套 Section ${node.id} 已展开到当前 Container`);
      node.children.forEach(appendNode);
      return;
    }

    warnings.push(`未知旧组件 ${node.type} 未参与自动转换`);
  };

  nodes.forEach(appendNode);
  flushDirectContent();
  return grids;
}

/**
 * Explicit editor migration for legacy wb.section nodes.
 * Nothing is persisted until the caller saves the resulting draft document.
 */
export function convertLegacySection(document: WebsiteNode, sectionId: string): ConvertLegacySectionResult {
  const section = findNode(document, sectionId);
  if (!section) {
    return { document, converted: false, reason: '找不到要转换的 Section', warnings: [] };
  }
  if (section.type !== 'wb.section') {
    return { document, converted: false, reason: '只有旧 Section 节点可以转换', warnings: [] };
  }

  const warnings: string[] = [];
  const children = normalizeLayoutChildren(document, section.id, section.children, warnings);
  const replacement: WebsiteNode = {
    ...section,
    type: 'wb.container',
    children,
  };

  return {
    document: updateNode(document, section.id, () => replacement),
    converted: true,
    nodeId: section.id,
    warnings,
  };
}
