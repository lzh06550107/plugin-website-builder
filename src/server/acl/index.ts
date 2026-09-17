export const WEBSITE_BUILDER_VIEW_SNIPPET = 'pm.website-builder.view';
export const WEBSITE_BUILDER_EDIT_SNIPPET = 'pm.website-builder.edit';
export const WEBSITE_BUILDER_PUBLISH_SNIPPET = 'pm.website-builder.publish';

export function getWebsiteBuilderAclDefinitions() {
  return [
    {
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
        'wbAssets:list',
        'wbAssets:get',
        'websiteBuilder:getDraft',
        'websiteBuilder:getPublished',
      ],
    },
    {
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
        'wbAssets:create',
        'websiteBuilder:saveDraft',
      ],
    },
    {
      name: WEBSITE_BUILDER_PUBLISH_SNIPPET,
      actions: ['websiteBuilder:publish'],
    },
  ];
}

export function registerWebsiteBuilderAcl(app: any) {
  for (const definition of getWebsiteBuilderAclDefinitions()) {
    app.acl.registerSnippet(definition);
  }

  // Published website data is intentionally public; draft and management APIs are not.
  // Asset files are authorized separately by File Manager's file-access authorizer.
  app.acl.allow('websiteBuilder', 'getPublishedByPath', 'public');
}
