import type { WebsiteStyle } from './style';

export type WebsiteDevice = 'desktop' | 'mobile';

export interface ResponsiveStyle {
  desktop?: WebsiteStyle;
  mobile?: WebsiteStyle;
}
