export interface WebsiteAssetFileAccessParams {
  dataSourceKey: string;
  collectionName: string;
}

type FileManagerLike = {
  registerFileAccessAuthorizer?: (authorizer: {
    name: string;
    authorize: (
      ctx: unknown,
      params: WebsiteAssetFileAccessParams,
    ) => boolean | Promise<boolean>;
  }) => void;
};

function getFileManager(app: any): FileManagerLike | undefined {
  for (const name of ['file-manager', '@nocobase/plugin-file-manager']) {
    try {
      const plugin = app?.pm?.get?.(name) as FileManagerLike | undefined;
      if (plugin) return plugin;
    } catch {
      // File Manager is optional for Website Builder. URL-based images remain usable without it.
    }
  }
  return undefined;
}

export function isWebsiteAssetFileAccess(params: WebsiteAssetFileAccessParams) {
  return params.dataSourceKey === 'main' && params.collectionName === 'wbAssets';
}

export function registerWebsiteAssetFileAccess(app: any) {
  const fileManager = getFileManager(app);
  if (typeof fileManager?.registerFileAccessAuthorizer !== 'function') return false;

  fileManager.registerFileAccessAuthorizer({
    name: 'website-builder-assets',
    authorize: (_ctx, params) => isWebsiteAssetFileAccess(params),
  });
  return true;
}
