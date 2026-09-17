import type { CSSProperties } from 'react';
import type { WebsiteDevice } from '../../shared/schema/responsive';
import type { WebsiteNode } from '../../shared/schema/node';
import type { WebsiteStyle } from '../../shared/schema/style';

const mergeStyle = (base: WebsiteStyle, override?: WebsiteStyle): WebsiteStyle => ({
  layout: { ...base.layout, ...override?.layout },
  spacing: { ...base.spacing, ...override?.spacing },
  typography: { ...base.typography, ...override?.typography },
  background: { ...base.background, ...override?.background },
  border: { ...base.border, ...override?.border },
});

export function resolveWebsiteStyle(base: WebsiteStyle, override?: WebsiteStyle): CSSProperties {
  const style = mergeStyle(base, override);
  const backgroundImage = style.background?.image;

  return {
    width: style.layout?.width,
    maxWidth: style.layout?.maxWidth,
    minHeight: style.layout?.minHeight,
    display: style.layout?.display,
    flexDirection: style.layout?.flexDirection as CSSProperties['flexDirection'],
    flexWrap: style.layout?.flexWrap as CSSProperties['flexWrap'],
    alignItems: style.layout?.alignItems,
    justifyContent: style.layout?.justifyContent,
    gridTemplateColumns: style.layout?.gridTemplateColumns,
    gap: style.layout?.gap,
    marginTop: style.spacing?.marginTop,
    marginRight: style.spacing?.marginRight,
    marginBottom: style.spacing?.marginBottom,
    marginLeft: style.spacing?.marginLeft,
    paddingTop: style.spacing?.paddingTop,
    paddingRight: style.spacing?.paddingRight,
    paddingBottom: style.spacing?.paddingBottom,
    paddingLeft: style.spacing?.paddingLeft,
    color: style.typography?.color,
    fontSize: style.typography?.fontSize,
    fontWeight: style.typography?.fontWeight,
    lineHeight: style.typography?.lineHeight,
    textAlign: style.typography?.textAlign,
    backgroundColor: style.background?.color,
    backgroundImage: backgroundImage
      ? backgroundImage.startsWith('url(')
        ? backgroundImage
        : `url(${JSON.stringify(backgroundImage)})`
      : undefined,
    backgroundSize: style.background?.size,
    backgroundPosition: style.background?.position,
    backgroundRepeat: style.background?.repeat,
    borderWidth: style.border?.width,
    borderStyle: style.border?.style,
    borderColor: style.border?.color,
    borderRadius: style.border?.radius,
  };
}

export function resolveNodeStyle(node: WebsiteNode, device: WebsiteDevice): CSSProperties {
  return resolveWebsiteStyle(node.style, node.responsive?.[device]);
}
