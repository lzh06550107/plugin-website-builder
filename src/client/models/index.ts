import { ModelConstructor } from '@nocobase/flow-engine';
import { PageModel } from './layout/PageModel';
import { SectionModel } from './layout/SectionModel';
import { ContainerModel } from './layout/ContainerModel';
import { GridModel } from './layout/GridModel';
import { HeadingModel } from './content/HeadingModel';
import { TextModel } from './content/TextModel';
import { ImageModel } from './content/ImageModel';
import { ButtonModel } from './content/ButtonModel';

export {
  PageModel,
  SectionModel,
  ContainerModel,
  GridModel,
  HeadingModel,
  TextModel,
  ImageModel,
  ButtonModel,
};

export default {
  PageModel,
  SectionModel,
  ContainerModel,
  GridModel,
  HeadingModel,
  TextModel,
  ImageModel,
  ButtonModel,
} as Record<string, ModelConstructor>;
