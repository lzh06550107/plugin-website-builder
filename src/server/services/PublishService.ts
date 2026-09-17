type Transaction = unknown;

type RecordLike = Record<string, any> & { get?: (key: string) => any };

interface RepositoryLike {
  findOne(options: Record<string, any>): Promise<RecordLike | null>;
  create?(options: Record<string, any>): Promise<RecordLike>;
  update?(options: Record<string, any>): Promise<unknown>;
}

export interface PublishDatabaseLike {
  getRepository(name: string): RepositoryLike;
  sequelize?: {
    transaction<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T>;
  };
}

function readField(record: RecordLike, key: string) {
  return typeof record.get === 'function' ? record.get(key) : record[key];
}

function cloneJson<T>(value: T): T {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export class PublishService {
  constructor(private readonly db: PublishDatabaseLike) {}

  async publish(pageId: string | number, userId?: string | number, note?: string) {
    const execute = async (transaction?: Transaction) => {
      const pageRepository = this.db.getRepository('wbPages');
      const versionRepository = this.db.getRepository('wbPageVersions');
      const page = await pageRepository.findOne({ filterByTk: pageId, transaction });

      if (!page) {
        throw new Error(`Website page not found: ${pageId}`);
      }

      const draftSchema = cloneJson(readField(page, 'draftSchema'));
      if (!draftSchema) {
        throw new Error(`Website page has no draft schema: ${pageId}`);
      }

      const latestVersion = await versionRepository.findOne({
        filter: { pageId },
        sort: ['-version'],
        transaction,
      });
      const version = Number(latestVersion ? readField(latestVersion, 'version') : 0) + 1;

      if (!versionRepository.create || !pageRepository.update) {
        throw new Error('Website Builder repositories are not writable');
      }

      const created = await versionRepository.create({
        values: {
          pageId,
          version,
          schema: draftSchema,
          publishNote: note || null,
          createdById: userId || null,
        },
        transaction,
      });
      const publishedVersionId = readField(created, 'id');

      await pageRepository.update({
        filterByTk: pageId,
        values: {
          status: 'published',
          publishedVersionId,
        },
        transaction,
      });

      return created;
    };

    return this.db.sequelize?.transaction ? this.db.sequelize.transaction(execute) : execute();
  }
}
