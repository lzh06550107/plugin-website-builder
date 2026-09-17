import { describe, expect, it } from 'vitest';
import models from '../../src/client/models';

describe('website builder FlowModels', () => {
  it('registers one model constructor for every V1 component type', () => {
    expect(Object.keys(models).sort()).toEqual([
      'WebsiteButtonModel',
      'WebsiteContainerModel',
      'WebsiteGridModel',
      'WebsiteHeadingModel',
      'WebsiteImageModel',
      'WebsitePageModel',
      'WebsiteSectionModel',
      'WebsiteTextModel',
    ]);
  });
});
