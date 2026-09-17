import type { WebsiteDevice, WebsiteNode, WebsiteNodeType, WebsitePageSchema, WebsiteStyle } from '../../shared/schema';
import { findNode, insertChild, removeNode, updateNode } from '../../shared/utils';
import { websiteComponentRegistry } from '../registry';

export type WebsiteStyleGroup = keyof WebsiteStyle;

function clone<T>(value: T): T {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function createWebsiteNode(type: WebsiteNodeType, id?: string): WebsiteNode {
  const definition = websiteComponentRegistry.get(type);
  if (!definition) {
    throw new Error(`Unknown website component: ${type}`);
  }
  return {
    id: id || `${type.replace('wb.', '')}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    props: clone(definition.defaultProps),
    style: clone(definition.defaultStyle),
    children: [],
  };
}

export function addComponent(
  schema: WebsitePageSchema,
  parentId: string,
  type: WebsiteNodeType,
  id?: string,
): WebsitePageSchema {
  if (!findNode(schema.root, parentId)) {
    throw new Error(`Website parent node not found: ${parentId}`);
  }
  return { ...schema, root: insertChild(schema.root, parentId, createWebsiteNode(type, id)) };
}

export function updateNodeProps(
  schema: WebsitePageSchema,
  nodeId: string,
  patch: Record<string, unknown>,
): WebsitePageSchema {
  return {
    ...schema,
    root: updateNode(schema.root, nodeId, (node) => ({ ...node, props: { ...node.props, ...patch } })),
  };
}

export function updateNodeStyleField(
  schema: WebsitePageSchema,
  nodeId: string,
  device: WebsiteDevice,
  group: WebsiteStyleGroup,
  key: string,
  value: unknown,
): WebsitePageSchema {
  return {
    ...schema,
    root: updateNode(schema.root, nodeId, (node) => {
      if (device === 'desktop') {
        const groupStyle = { ...((node.style[group] as Record<string, unknown> | undefined) || {}) };
        if (value === '' || value == null) delete groupStyle[key];
        else groupStyle[key] = value;
        return { ...node, style: { ...node.style, [group]: groupStyle } };
      }

      const mobileStyle = { ...(node.responsive?.mobile || {}) };
      const groupStyle = { ...((mobileStyle[group] as Record<string, unknown> | undefined) || {}) };
      if (value === '' || value == null) delete groupStyle[key];
      else groupStyle[key] = value;
      return {
        ...node,
        responsive: {
          ...node.responsive,
          mobile: { ...mobileStyle, [group]: groupStyle },
        },
      };
    }),
  };
}

export function removeComponent(schema: WebsitePageSchema, nodeId: string): WebsitePageSchema {
  if (schema.root.id === nodeId) return schema;
  return { ...schema, root: removeNode(schema.root, nodeId) };
}
