import { Plugin } from '@nocobase/server';
import { registerWebsiteBuilderAcl } from './acl';
import { registerWebsiteAssetFileAccess } from './assets/fileAccess';
import { registerWebsiteBuilderResource } from './resources/websiteBuilder';

export class PluginWebsiteBuilderServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    registerWebsiteBuilderResource(this.app);
    registerWebsiteBuilderAcl(this.app);
    registerWebsiteAssetFileAccess(this.app);
  }

  async install() {}
  async afterEnable() {}
  async afterDisable() {}
  async remove() {}
}

export default PluginWebsiteBuilderServer;
