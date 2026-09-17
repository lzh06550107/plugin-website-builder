export const WEBSITE_BUILDER_VIEW_SNIPPET = 'pm.website-builder.view';
export const WEBSITE_BUILDER_EDIT_SNIPPET = 'pm.website-builder.edit';
export const WEBSITE_BUILDER_PUBLISH_SNIPPET = 'pm.website-builder.publish';

export function registerWebsiteBuilderAcl(app: any) {
  app.acl.registerSnippet({
    name: WEBSITE_BUILDER_VIEW_SNIPPET,
    actions: [
      'wbSites:list',
      'wbSites:get',
      'wbPages:list',
      'wbPages:get',
      'wbThemes:list',
      'wbThemes:get',
      'wbPageVersions:list',
      'wbPageVersions:get',
      'websiteBuilder:getDraft',
      'websiteBuilder:getPublished',
    ],
  });

  app.acl.registerSnippet({
    name: WEBSITE_BUILDER_EDIT_SNIPPET,
    actions: [
      'wbSites:create',
      'wbSites:update',
      'wbSites:destroy',
      'wbPages:create',
      'wbPages:update',
      'wbPages:destroy',
      'wbThemes:create',
      'wbThemes:update',
      'wbThemes:destroy',
      'websiteBuilder:saveDraft',
    ],
  });

  app.acl.registerSnippet({
    name: WEBSITE_BUILDER_PUBLISH_SNIPPET,
    actions: ['websiteBuilder:publish'],
  });

  // Published website data is intentionally public; draft and management APIs are not.
  app.acl.allow('websiteBuilder', 'getPublishedByPath', 'public');
}
