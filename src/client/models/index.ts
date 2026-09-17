import type { ModelConstructor } from '@nocobase/flow-engine';
import {
  WebsiteContainerModel,
  WebsiteGridModel,
  WebsitePageModel,
  WebsiteSectionModel,
} from './layout';
import {
  WebsiteButtonModel,
  WebsiteHeadingModel,
  WebsiteImageModel,
  WebsiteTextModel,
} from './content';

export * from './WebsiteNodeModel';
export * from './layout';
export * from './content';

export default {
  WebsitePageModel,
  WebsiteSectionModel,
  WebsiteContainerModel,
  WebsiteGridModel,
  WebsiteHeadingModel,
  WebsiteTextModel,
  WebsiteImageModel,
  WebsiteButtonModel,
} as Record<string, ModelConstructor>;
