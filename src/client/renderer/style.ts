import type { DeviceType, WebsiteNode, WebsiteStyle } from '../../shared/schema';

export type ResolvedWebsiteStyle = Record<string, string | number | undefined>;

function mergeStyle(base: WebsiteStyle, override: Partial<WebsiteStyle> = {}): WebsiteStyle {
  return {
    layout: { ...base.layout, ...override.layout },
    spacing: { ...base.spacing, ...override.spacing },
    typography: { ...base.typography, ...override.typography },
    background: { ...base.background, ...override.background },
    border: { ...base.border, ...override.border },
  };
}

export function resolveNodeStyle(node: WebsiteNode, device: DeviceType): ResolvedWebsiteStyle {
  const merged = mergeStyle(node.style || {}, node.responsive?.[device] || {});
  const backgroundImage = merged.background?.image ? `url(${merged.background.image})` : undefined;
  const border = merged.border?.width
    ? `${merged.border.width} ${merged.border.style || 'solid'} ${merged.border.color || 'transparent'}`
    : undefined;

  const resolved: ResolvedWebsiteStyle = {
    ...merged.layout,
    ...merged.spacing,
    ...merged.typography,
  };
  if (merged.background?.color) resolved.backgroundColor = merged.background.color;
  if (backgroundImage) resolved.backgroundImage = backgroundImage;
  if (border) resolved.border = border;
  if (merged.border?.radius) resolved.borderRadius = merged.border.radius;
  return resolved;
}
