export interface WebsiteLayoutStyle {
  width?: string;
  maxWidth?: string;
  minHeight?: string;
  display?: string;
  flexDirection?: string;
  flexWrap?: string;
  alignItems?: string;
  justifyContent?: string;
  gridTemplateColumns?: string;
  gap?: string;
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
  size?: string;
  position?: string;
  repeat?: string;
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
