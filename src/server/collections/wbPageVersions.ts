import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'wbPageVersions',
  dataCategory: 'business',
  shared: true,
  migrationRules: ['overwrite', 'schema-only'],
  fields: [
    { type: 'belongsTo', name: 'page', target: 'wbPages', foreignKey: 'pageId' },
    { type: 'integer', name: 'version', required: true },
    { type: 'json', name: 'schema', required: true },
    { type: 'text', name: 'publishNote' },
    { type: 'bigInt', name: 'createdById' },
  ],
  indexes: [{ unique: true, fields: ['pageId', 'version'] }],
});
