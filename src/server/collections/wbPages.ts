import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'wbPages',
  dataCategory: 'business',
  shared: true,
  migrationRules: ['overwrite', 'schema-only'],
  fields: [
    { type: 'belongsTo', name: 'site', target: 'wbSites', foreignKey: 'siteId' },
    { type: 'string', name: 'name', required: true },
    { type: 'string', name: 'title' },
    { type: 'string', name: 'slug', required: true },
    { type: 'string', name: 'status', defaultValue: 'draft' },
    { type: 'json', name: 'draftSchema' },
    { type: 'bigInt', name: 'publishedVersionId' },
    { type: 'string', name: 'seoTitle' },
    { type: 'text', name: 'seoDescription' },
  ],
  indexes: [{ unique: true, fields: ['siteId', 'slug'] }],
});
