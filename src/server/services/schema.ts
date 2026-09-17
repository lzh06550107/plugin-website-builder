import type { WebsiteNode } from '../../shared/schema';
import { validateWebsiteNode } from '../../shared/schema';

export function assertValidWebsiteSchema(schema: WebsiteNode): WebsiteNode {
  const result = validateWebsiteNode(schema);
  if (!result.valid) {
    throw new Error(`Invalid Website Schema: ${result.errors.join('; ')}`);
  }
  return schema;
}

export function nextPageVersion(current?: number | null) {
  return Number(current || 0) + 1;
}
