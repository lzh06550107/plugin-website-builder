import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'wbAssets',
  title: 'Website Builder Assets',
  dataCategory: 'business',
  createdBy: true,
  updatedBy: true,
  template: 'file',
  fields: [
    { type: 'string', name: 'title' },
    { type: 'string', name: 'filename' },
    { type: 'string', name: 'extname' },
    { type: 'integer', name: 'size' },
    { type: 'string', name: 'mimetype' },
    { type: 'text', name: 'path' },
    { type: 'text', name: 'url' },
    { type: 'text', name: 'preview' },
    {
      type: 'belongsTo',
      name: 'storage',
      target: 'storages',
      foreignKey: 'storageId',
    },
    {
      type: 'jsonb',
      name: 'meta',
      deletable: false,
      defaultValue: {},
    },
  ],
});
