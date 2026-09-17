import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'wbSites',
  title: 'Website Builder Sites',
  fields: [
    { type: 'string', name: 'name', allowNull: false },
    { type: 'string', name: 'key', allowNull: false, unique: true },
    { type: 'string', name: 'domain' },
    { type: 'string', name: 'status', defaultValue: 'active' },
    { type: 'string', name: 'defaultLocale', defaultValue: 'zh-CN' },
    { type: 'hasMany', name: 'pages', target: 'wbPages', foreignKey: 'siteId' },
    { type: 'hasOne', name: 'theme', target: 'wbThemes', foreignKey: 'siteId' },
  ],
});
