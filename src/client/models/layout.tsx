import { WebsiteNodeModel } from './WebsiteNodeModel';

export class WebsitePageModel extends WebsiteNodeModel {
  static websiteNodeType = 'wb.page' as const;
}
export class WebsiteSectionModel extends WebsiteNodeModel {
  static websiteNodeType = 'wb.section' as const;
}
export class WebsiteContainerModel extends WebsiteNodeModel {
  static websiteNodeType = 'wb.container' as const;
}
export class WebsiteGridModel extends WebsiteNodeModel {
  static websiteNodeType = 'wb.grid' as const;
}
