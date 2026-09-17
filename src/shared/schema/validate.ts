import type { SchemaValidationResult, WebsiteNode } from './types';

export function validateWebsiteNode(node: WebsiteNode): SchemaValidationResult {
  const errors: string[] = [];

  if (!node || typeof node !== 'object') {
    return { valid: false, errors: ['Website node must be an object'] };
  }
  if (!node.id || typeof node.id !== 'string') errors.push('Website node id is required');
  if (!node.type || typeof node.type !== 'string' || !node.type.startsWith('wb.')) {
    errors.push('Website node type must use the wb.* namespace');
  }
  if (!node.props || typeof node.props !== 'object' || Array.isArray(node.props)) {
    errors.push(`Website node ${node.id || '<unknown>'} props must be an object`);
  }
  if (!node.style || typeof node.style !== 'object' || Array.isArray(node.style)) {
    errors.push(`Website node ${node.id || '<unknown>'} style must be an object`);
  }
  if (!Array.isArray(node.children)) {
    errors.push(`Website node ${node.id || '<unknown>'} children must be an array`);
  } else {
    for (const child of node.children) {
      const childResult = validateWebsiteNode(child);
      errors.push(...childResult.errors);
    }
  }

  return { valid: errors.length === 0, errors };
}
