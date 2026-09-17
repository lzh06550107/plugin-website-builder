import { Plugin } from '@nocobase/server';
import { registerWebsiteBuilderAcl } from './acl';
import { registerWebsiteAssetFileAccess } from './assets/fileAccess';
import { registerWebsiteBuilderResource } from './resources/websiteBuilder';

export class PluginWebsiteBuilderServer extends Plugin {
  protected assetFileAccessRegistered = false;

  async afterAdd() {}

  async beforeLoad() {}

  protected registerAssetFileAccess() {
    if (this.assetFileAccessRegistered) return;
    this.assetFileAccessRegistered = registerWebsiteAssetFileAccess(this.app);
  }

  async load() {
    registerWebsiteBuilderResource(this.app);
    registerWebsiteBuilderAcl(this.app);
    this.registerAssetFileAccess();
    this.app.on('afterLoad', () => this.registerAssetFileAccess());
  }

  async install() {}
  async afterEnable() {}
  async afterDisable() {}
  async remove() {}
}

export default PluginWebsiteBuilderServer;
