import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'wbThemes',
  title: 'Website Builder Themes',
  fields: [
    { type: 'bigInt', name: 'siteId', allowNull: false, unique: true },
    { type: 'belongsTo', name: 'site', target: 'wbSites', foreignKey: 'siteId' },
    { type: 'string', name: 'name', allowNull: false, defaultValue: 'Default' },
    { type: 'json', name: 'tokens', defaultValue: {} },
    { type: 'json', name: 'breakpoints', defaultValue: { desktop: 1200, mobile: 767 } },
  ],
});
