import { WebsiteNodeModel } from './WebsiteNodeModel';

export class WebsiteHeadingModel extends WebsiteNodeModel {
  static websiteNodeType = 'wb.heading' as const;
}
export class WebsiteTextModel extends WebsiteNodeModel {
  static websiteNodeType = 'wb.text' as const;
}
export class WebsiteImageModel extends WebsiteNodeModel {
  static websiteNodeType = 'wb.image' as const;
}
export class WebsiteButtonModel extends WebsiteNodeModel {
  static websiteNodeType = 'wb.button' as const;
}
