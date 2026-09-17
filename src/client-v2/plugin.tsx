import { Plugin } from '@nocobase/client-v2';

export class PluginWebsiteBuilderClientV2 extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      PageModel: { loader: () => import('../client/models/layout/PageModel') },
      SectionModel: { loader: () => import('../client/models/layout/SectionModel') },
      ContainerModel: { loader: () => import('../client/models/layout/ContainerModel') },
      GridModel: { loader: () => import('../client/models/layout/GridModel') },
      HeadingModel: { loader: () => import('../client/models/content/HeadingModel') },
      TextModel: { loader: () => import('../client/models/content/TextModel') },
      ImageModel: { loader: () => import('../client/models/content/ImageModel') },
      ButtonModel: { loader: () => import('../client/models/content/ButtonModel') },
    });

    this.pluginSettingsManager.addMenuItem({
      key: 'website-builder',
      title: this.t('Website Builder'),
      icon: 'LayoutOutlined',
    });
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'website-builder',
      key: 'index',
      title: this.t('Website Builder'),
      componentLoader: () => import('./pages/WebsiteBuilderSettingsPage'),
    });

    this.router.add('website-builder.public', {
      path: '/website/:siteKey/*',
      componentLoader: () => import('./pages/PublishedPage'),
    });
  }
}

export default PluginWebsiteBuilderClientV2;
