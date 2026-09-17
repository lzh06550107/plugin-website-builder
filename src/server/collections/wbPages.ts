import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'wbPages',
  title: 'Website Builder Pages',
  fields: [
    { type: 'bigInt', name: 'siteId', allowNull: false, index: true },
    { type: 'belongsTo', name: 'site', target: 'wbSites', foreignKey: 'siteId' },
    { type: 'string', name: 'name', allowNull: false },
    { type: 'string', name: 'title', allowNull: false },
    { type: 'string', name: 'slug', allowNull: false },
    { type: 'string', name: 'routePath', allowNull: false },
    { type: 'string', name: 'status', defaultValue: 'draft' },
    { type: 'json', name: 'draftSchema' },
    { type: 'bigInt', name: 'publishedVersionId' },
    { type: 'string', name: 'seoTitle' },
    { type: 'text', name: 'seoDescription' },
    { type: 'hasMany', name: 'versions', target: 'wbPageVersions', foreignKey: 'pageId' },
  ],
  indexes: [
    { fields: ['siteId', 'routePath'], unique: true },
  ],
});
