import type { ResponsiveStyle } from './responsive';
import type { WebsiteStyle } from './style';

export type WebsiteNodeType =
  | 'wb.page'
  | 'wb.section'
  | 'wb.container'
  | 'wb.grid'
  | 'wb.heading'
  | 'wb.text'
  | 'wb.image'
  | 'wb.button';

export interface WebsiteNode {
  id: string;
  type: WebsiteNodeType;
  props: Record<string, unknown>;
  style: WebsiteStyle;
  responsive?: ResponsiveStyle;
  children: WebsiteNode[];
}
