export function registerWebsiteBuilderAcl(app: any) {
  app.acl.allow('wbSites', '*', 'loggedIn');
  app.acl.allow('wbPages', '*', 'loggedIn');
  app.acl.allow('wbThemes', '*', 'loggedIn');
  app.acl.allow('wbPageVersions', 'list', 'loggedIn');
  app.acl.allow('wbPageVersions', 'get', 'loggedIn');
  app.acl.allow('websiteBuilder', 'getDraft', 'loggedIn');
  app.acl.allow('websiteBuilder', 'saveDraft', 'loggedIn');
  app.acl.allow('websiteBuilder', 'publish', 'loggedIn');
  app.acl.allow('websiteBuilder', 'getPublished', 'loggedIn');
  app.acl.allow('websiteBuilder', 'getPublishedByPath', 'public');
}
