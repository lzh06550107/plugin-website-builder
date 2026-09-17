export function registerWebsiteBuilderAcl(app: any, pluginName: string) {
  app.acl.registerSnippet({
    name: `pm.${pluginName}.view`,
    actions: ['wbSites:list', 'wbSites:get', 'wbPages:list', 'wbPages:get', 'wbPageVersions:list', 'wbPageVersions:get'],
  });
  app.acl.registerSnippet({
    name: `pm.${pluginName}.edit`,
    actions: [
      'wbSites:create', 'wbSites:update', 'wbSites:destroy',
      'wbPages:create', 'wbPages:update', 'wbPages:destroy',
    ],
  });
  app.acl.registerSnippet({
    name: `pm.${pluginName}.publish`,
    actions: ['websiteBuilder:publish'],
  });
  app.acl.allow('websiteBuilder', 'published', 'public');
}
