import { Plugin } from '@nocobase/client';
import models from './models';
import WebsiteBuilderSettingsPage from './pages/WebsiteBuilderSettingsPage';
import PublishedPage from './pages/PublishedPage';

export class PluginWebsiteBuilderClient extends Plugin {
  async load() {
    this.flowEngine.registerModels(models);

    this.pluginSettingsManager.add('website-builder', {
      title: 'Website Builder',
      icon: 'LayoutOutlined',
      Component: WebsiteBuilderSettingsPage,
    });

    this.app.router.add('website-builder.public', {
      path: '/website/:siteKey/*',
      Component: PublishedPage,
    });
  }
}

export default PluginWebsiteBuilderClient;
