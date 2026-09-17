import { Plugin } from '@nocobase/server';
import { registerWebsiteBuilderAcl } from './acl';
import { registerWebsiteBuilderResources } from './resources/websiteBuilder';

export class PluginWebsiteBuilderServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    registerWebsiteBuilderResources(this.app);
    registerWebsiteBuilderAcl(this.app, this.name);
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginWebsiteBuilderServer;
