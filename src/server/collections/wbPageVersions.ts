import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'wbPageVersions',
  title: 'Website Builder Page Versions',
  fields: [
    { type: 'bigInt', name: 'pageId', allowNull: false, index: true },
    { type: 'belongsTo', name: 'page', target: 'wbPages', foreignKey: 'pageId' },
    { type: 'integer', name: 'version', allowNull: false },
    { type: 'json', name: 'schema', allowNull: false },
    { type: 'text', name: 'publishNote' },
  ],
  indexes: [
    { fields: ['pageId', 'version'], unique: true },
  ],
});
