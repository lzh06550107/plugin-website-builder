import { Plugin } from '@nocobase/server';
import { registerWebsiteBuilderAcl } from './acl';
import { registerWebsiteBuilderResource } from './resources/websiteBuilder';

export class PluginWebsiteBuilderServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    registerWebsiteBuilderResource(this.app);
    registerWebsiteBuilderAcl(this.app);
  }

  async install() {}
  async afterEnable() {}
  async afterDisable() {}
  async remove() {}
}

export default PluginWebsiteBuilderServer;
