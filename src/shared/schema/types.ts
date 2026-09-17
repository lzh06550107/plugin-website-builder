export type DeviceType = 'desktop' | 'mobile';

export interface WebsiteLayoutStyle {
  width?: string;
  maxWidth?: string;
  minHeight?: string;
  display?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: string;
  gridTemplateColumns?: string;
}

export interface WebsiteSpacingStyle {
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
}

export interface WebsiteTypographyStyle {
  color?: string;
  fontSize?: string;
  fontWeight?: string | number;
  lineHeight?: string | number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

export interface WebsiteBackgroundStyle {
  color?: string;
  image?: string;
}

export interface WebsiteBorderStyle {
  width?: string;
  style?: string;
  color?: string;
  radius?: string;
}

export interface WebsiteStyle {
  layout?: WebsiteLayoutStyle;
  spacing?: WebsiteSpacingStyle;
  typography?: WebsiteTypographyStyle;
  background?: WebsiteBackgroundStyle;
  border?: WebsiteBorderStyle;
}

export interface ResponsiveStyle {
  desktop?: Partial<WebsiteStyle>;
  mobile?: Partial<WebsiteStyle>;
}

export interface WebsiteNode {
  id: string;
  type: string;
  props: Record<string, unknown>;
  style: WebsiteStyle;
  responsive?: ResponsiveStyle;
  children: WebsiteNode[];
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
}
