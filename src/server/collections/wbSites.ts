import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'wbSites',
  dataCategory: 'business',
  shared: true,
  migrationRules: ['overwrite', 'schema-only'],
  fields: [
    { type: 'string', name: 'name', required: true },
    { type: 'string', name: 'key', required: true, unique: true },
    { type: 'string', name: 'domain' },
    { type: 'string', name: 'status', defaultValue: 'active' },
  ],
});
