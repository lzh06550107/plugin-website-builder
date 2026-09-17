# Website Asset Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a private Website Builder media library backed by a NocoBase file collection, while keeping published image files anonymously readable and keeping media enumeration/admin APIs private.

**Architecture:** Add `wbAssets` as a `template: 'file'` collection, extend the existing Website Builder ACL snippets for list/get/create, and register a File Manager access authorizer that only authorizes file-content access for `main + wbAssets`. On the client, isolate media API normalization and picker UI under `src/client/editor/assets/`; the picker submits only `{ src, alt }` back into the existing `updateInlineImage()` command, so published rendering remains schema-only.

**Tech Stack:** NocoBase 2.x (`@nocobase/database`, `@nocobase/server`, `@nocobase/client`), React, Ant Design, Node `node:test`, existing Website Builder command/state architecture.

**Spec:** `docs/superpowers/specs/2026-09-17-website-asset-library-design.md`

## Global Constraints

- Do not expose `attachments:list`.
- Do not expose public `wbAssets:list`, `wbAssets:get`, or `wbAssets:create`.
- Published pages persist only `wb.image.props.src` and `wb.image.props.alt`; no asset record is embedded in Website Schema.
- V1 media library is global to Website Builder; no `siteId` partitioning.
- V1 does not provide asset deletion.
- Uploads must reuse NocoBase File Manager; do not implement multipart/S3/OSS/COS handling in this plugin.
- Existing manual image URL editing remains available as fallback.
- Preview/Published rendering must not render the asset picker or call media-management APIs.
- Continue on branch `feature/layout-dnd-v1`; do not merge to `master` before the real local NocoBase build/manual Gate passes.

---

### Task 1: Add the `wbAssets` file collection contract

**Files:**
- Create: `src/server/collections/wbAssets.ts`
- Create: `src/shared/__tests__/asset-library-server-contract.test.ts`

**Interfaces:**
- Produces collection name `wbAssets` with `template: 'file'`.
- Later tasks rely on the exact resource name `wbAssets` for ACL, upload, list, file URL, and picker API calls.

- [ ] **Step 1: Write the failing collection contract test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import wbAssets from '../../server/collections/wbAssets';

test('wbAssets is a dedicated NocoBase file collection', () => {
  const options = wbAssets as any;
  assert.equal(options.name, 'wbAssets');
  assert.equal(options.template, 'file');
  assert.equal(options.title, 'Website Builder Assets');
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run from the plugin package:

```bash
yarn tsx --test src/shared/__tests__/asset-library-server-contract.test.ts
```

Expected: FAIL because `src/server/collections/wbAssets.ts` does not exist.

- [ ] **Step 3: Add the minimal file collection**

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'wbAssets',
  title: 'Website Builder Assets',
  template: 'file',
});
```

- [ ] **Step 4: Re-run the focused test and verify GREEN**

```bash
yarn tsx --test src/shared/__tests__/asset-library-server-contract.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/collections/wbAssets.ts src/shared/__tests__/asset-library-server-contract.test.ts
git commit -m "feat: add website asset file collection"
```

---

### Task 2: Extend Website Builder ACL and register public file-content authorization

**Files:**
- Create: `src/server/assets/fileAccess.ts`
- Modify: `src/server/acl/index.ts`
- Modify: `src/server/plugin.ts`
- Extend test: `src/shared/__tests__/asset-library-server-contract.test.ts`

**Interfaces:**
- Produces `isWebsiteAssetFileAccess(params): boolean`.
- Produces `registerWebsiteAssetFileAccess(app): boolean` where `false` means File Manager is unavailable.
- Registers authorizer name `website-builder-assets`.

- [ ] **Step 1: Add failing pure ACL/authorizer tests**

Append:

```ts
import { isWebsiteAssetFileAccess } from '../../server/assets/fileAccess';
import {
  WEBSITE_BUILDER_EDIT_SNIPPET,
  WEBSITE_BUILDER_VIEW_SNIPPET,
  getWebsiteBuilderAclDefinitions,
} from '../../server/acl';

test('website asset file authorizer is narrowly scoped', () => {
  assert.equal(isWebsiteAssetFileAccess({ dataSourceKey: 'main', collectionName: 'wbAssets' }), true);
  assert.equal(isWebsiteAssetFileAccess({ dataSourceKey: 'main', collectionName: 'attachments' }), false);
  assert.equal(isWebsiteAssetFileAccess({ dataSourceKey: 'another', collectionName: 'wbAssets' }), false);
});

test('asset management actions are private Website Builder snippet actions', () => {
  const defs = getWebsiteBuilderAclDefinitions();
  const view = defs.find((item) => item.name === WEBSITE_BUILDER_VIEW_SNIPPET)!;
  const edit = defs.find((item) => item.name === WEBSITE_BUILDER_EDIT_SNIPPET)!;
  assert.ok(view.actions.includes('wbAssets:list'));
  assert.ok(view.actions.includes('wbAssets:get'));
  assert.ok(edit.actions.includes('wbAssets:create'));
  assert.equal(view.actions.includes('wbAssets:create'), false);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
yarn tsx --test src/shared/__tests__/asset-library-server-contract.test.ts
```

Expected: FAIL because the helper and exported ACL definitions do not exist.

- [ ] **Step 3: Refactor ACL definitions into a testable constant without changing existing behavior**

In `src/server/acl/index.ts`, create definitions first and register from them:

```ts
export function getWebsiteBuilderAclDefinitions() {
  return [
    {
      name: WEBSITE_BUILDER_VIEW_SNIPPET,
      actions: [
        'wbSites:list', 'wbSites:get',
        'wbPages:list', 'wbPages:get',
        'wbThemes:list', 'wbThemes:get',
        'wbPageVersions:list', 'wbPageVersions:get',
        'wbAssets:list', 'wbAssets:get',
        'websiteBuilder:getDraft', 'websiteBuilder:getPublished',
      ],
    },
    {
      name: WEBSITE_BUILDER_EDIT_SNIPPET,
      actions: [
        'wbSites:create', 'wbSites:update', 'wbSites:destroy',
        'wbPages:create', 'wbPages:update', 'wbPages:destroy',
        'wbThemes:create', 'wbThemes:update', 'wbThemes:destroy',
        'wbAssets:create',
        'websiteBuilder:saveDraft',
      ],
    },
    {
      name: WEBSITE_BUILDER_PUBLISH_SNIPPET,
      actions: ['websiteBuilder:publish'],
    },
  ];
}
```

Keep the existing public allow limited to:

```ts
app.acl.allow('websiteBuilder', 'getPublishedByPath', 'public');
```

Do not add any public `wbAssets:*` allow.

- [ ] **Step 4: Add the File Manager authorizer adapter**

```ts
export interface WebsiteAssetFileAccessParams {
  dataSourceKey: string;
  collectionName: string;
}

export function isWebsiteAssetFileAccess(params: WebsiteAssetFileAccessParams) {
  return params.dataSourceKey === 'main' && params.collectionName === 'wbAssets';
}

type FileManagerLike = {
  registerFileAccessAuthorizer?: (authorizer: {
    name: string;
    authorize: (ctx: unknown, params: WebsiteAssetFileAccessParams) => boolean | Promise<boolean>;
  }) => void;
};

export function registerWebsiteAssetFileAccess(app: any) {
  const fileManager = (app.pm.get('file-manager') || app.pm.get('@nocobase/plugin-file-manager')) as FileManagerLike | undefined;
  if (typeof fileManager?.registerFileAccessAuthorizer !== 'function') return false;
  fileManager.registerFileAccessAuthorizer({
    name: 'website-builder-assets',
    authorize: (_ctx, params) => isWebsiteAssetFileAccess(params),
  });
  return true;
}
```

If `pm.get()` is discovered to throw for a missing plugin in the pinned NocoBase version, wrap lookup in a small `try/catch` and return `false`; do not make File Manager a hard runtime crash dependency.

- [ ] **Step 5: Register the authorizer during server plugin load**

```ts
async load() {
  registerWebsiteBuilderResource(this.app);
  registerWebsiteBuilderAcl(this.app);
  registerWebsiteAssetFileAccess(this.app);
}
```

- [ ] **Step 6: Run focused tests**

```bash
yarn tsx --test src/shared/__tests__/asset-library-server-contract.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/server/assets/fileAccess.ts src/server/acl/index.ts src/server/plugin.ts src/shared/__tests__/asset-library-server-contract.test.ts
git commit -m "feat: secure website asset access"
```

---

### Task 3: Add a normalized client asset API

**Files:**
- Create: `src/client/editor/assets/types.ts`
- Create: `src/client/editor/assets/assetApi.ts`
- Create: `src/client/editor/assets/index.ts`
- Create: `src/shared/__tests__/asset-api.test.ts`

**Interfaces:**
- `normalizeWebsiteAsset(record): WebsiteAsset | null`
- `listWebsiteAssets(api, options): Promise<WebsiteAssetPage>`
- `WebsiteAssetListOptions = { page?: number; pageSize?: number; search?: string }`

- [ ] **Step 1: Write failing normalization and request-contract tests**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { listWebsiteAssets, normalizeWebsiteAsset } from '../../client/editor/assets/assetApi';

test('normalizeWebsiteAsset accepts image records with url', () => {
  assert.deepEqual(
    normalizeWebsiteAsset({ id: 1, title: 'Hero', filename: 'hero.png', mimetype: 'image/png', url: '/files/hero.png' }),
    { id: 1, title: 'Hero', filename: 'hero.png', mimetype: 'image/png', url: '/files/hero.png' },
  );
});

test('normalizeWebsiteAsset rejects non-images and records without url', () => {
  assert.equal(normalizeWebsiteAsset({ id: 2, mimetype: 'application/pdf', url: '/a.pdf' }), null);
  assert.equal(normalizeWebsiteAsset({ id: 3, mimetype: 'image/png' }), null);
});

test('listWebsiteAssets queries wbAssets with pagination, image filter, newest first and search', async () => {
  let params: any;
  const api = {
    resource(name: string) {
      assert.equal(name, 'wbAssets');
      return {
        async list(next: any) {
          params = next;
          return { data: { data: [{ id: 1, mimetype: 'image/png', url: '/1.png' }], meta: { count: 1, page: 2, pageSize: 12 } } };
        },
      };
    },
  };
  const result = await listWebsiteAssets(api, { page: 2, pageSize: 12, search: 'hero' });
  assert.equal(params.page, 2);
  assert.equal(params.pageSize, 12);
  assert.deepEqual(params.sort, ['-createdAt']);
  assert.equal(result.items.length, 1);
  assert.equal(result.total, 1);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
yarn tsx --test src/shared/__tests__/asset-api.test.ts
```

Expected: FAIL because the asset API module does not exist.

- [ ] **Step 3: Implement the minimum normalized API**

Use `api.resource('wbAssets').list(...)`; keep the backend filter constrained to images and build title/filename search as an OR filter supported by the pinned NocoBase API. Normalize every row and drop invalid rows.

```ts
export interface WebsiteAssetPage {
  items: WebsiteAsset[];
  total: number;
  page: number;
  pageSize: number;
}
```

Read response metadata defensively from `response.data.meta`; default to request page/pageSize and `items.length` when missing.

- [ ] **Step 4: Run focused tests**

```bash
yarn tsx --test src/shared/__tests__/asset-api.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/client/editor/assets src/shared/__tests__/asset-api.test.ts
git commit -m "feat: add website asset client API"
```

---

### Task 4: Build the picker state contract before the visual picker

**Files:**
- Create: `src/client/editor/assets/pickerState.ts`
- Create: `src/shared/__tests__/asset-picker-state.test.ts`

**Interfaces:**
- Produces a pure state reducer used by `WebsiteAssetPicker.tsx`.
- `buildAssetApplyValue(state): { src: string; alt: string } | null` is the only path that creates a schema patch.

- [ ] **Step 1: Write failing state tests**

Cover these exact behaviors:

```ts
// library selection does not apply until explicit apply
// URL mode returns trimmed URL + alt
// empty URL cannot apply
// cancel/reset preserves original schema outside the reducer
```

Use a state shape:

```ts
export interface WebsiteAssetPickerState {
  mode: 'library' | 'upload' | 'url';
  selected?: WebsiteAsset;
  url: string;
  alt: string;
}
```

- [ ] **Step 2: Run and verify RED**

```bash
yarn tsx --test src/shared/__tests__/asset-picker-state.test.ts
```

- [ ] **Step 3: Implement pure reducer/helpers**

`buildAssetApplyValue()` must select `selected.url` in library/upload mode and `url.trim()` in URL mode, and return `null` when no usable URL exists.

- [ ] **Step 4: Run and verify GREEN**

```bash
yarn tsx --test src/shared/__tests__/asset-picker-state.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/client/editor/assets/pickerState.ts src/shared/__tests__/asset-picker-state.test.ts
git commit -m "test: define website asset picker state"
```

---

### Task 5: Implement `WebsiteAssetPicker` with library, upload, and URL modes

**Files:**
- Create: `src/client/editor/assets/WebsiteAssetPicker.tsx`
- Modify: `src/client/editor/assets/index.ts`
- Modify if needed for NocoBase type availability: `src/client/client.d.ts`

**Interfaces:**

```ts
export interface WebsiteAssetPickerProps {
  open: boolean;
  initialSrc: string;
  initialAlt: string;
  onCancel: () => void;
  onApply: (value: { src: string; alt: string }) => void;
}
```

- [ ] **Step 1: Implement the picker shell around the tested state contract**

Use Ant Design `Modal`, `Tabs`, `Input`, `Pagination`, loading/error states, and a thumbnail grid. Obtain NocoBase API via `useAPIClient()` from `@nocobase/client`.

- [ ] **Step 2: Implement media library loading**

On `open`, mode/page/search changes, call `listWebsiteAssets(api, ...)`. Use 12 items/page. Selecting a card updates local picker state only; it must not call `onApply`.

- [ ] **Step 3: Implement upload using NocoBase File Manager upload component**

Reuse the exported NocoBase upload/uploader component with target action/resource `wbAssets:create`, `multiple={false}`, and `accept="image/*"`. Convert the successful returned file value through `normalizeWebsiteAsset()`, set it as the current local selection, and stay inside the picker until the user clicks Apply.

Do not add a custom `fetch`, `FormData`, or object-storage implementation.

- [ ] **Step 4: Preserve manual URL fallback**

The URL tab exposes URL + Alt and an image preview. If File Manager upload components are not available at runtime, library/upload tabs show an unavailable message while URL remains usable.

- [ ] **Step 5: Apply only through the tested helper**

```ts
const value = buildAssetApplyValue(state);
if (!value) {
  message.warning('请选择图片或填写图片 URL');
  return;
}
onApply(value);
```

- [ ] **Step 6: Type-check/build the plugin locally**

```bash
cd ~/nocobase
yarn build @lzh/plugin-website-builder
```

Expected: build passes. If NocoBase's pinned Upload export differs from current upstream, adapt only the upload adapter layer; do not change the domain contract.

- [ ] **Step 7: Commit**

```bash
git add src/client/editor/assets src/client/client.d.ts
git commit -m "feat: add website asset picker"
```

---

### Task 6: Replace the temporary Image URL modal with `WebsiteAssetPicker`

**Files:**
- Modify: `src/client/editor/WebsiteEditor.tsx`
- Modify: `docs/website-builder-v1-selection-interaction.md`
- Extend test: `src/shared/__tests__/inline-image-edit.test.ts`

**Interfaces:**
- Reuses existing `onInlineImageEditRequest(nodeId)` interaction.
- Reuses existing `updateInlineImage(document, nodeId, { src, alt })` command.

- [ ] **Step 1: Add/extend regression test for Image update invariants**

Assert that applying a picked asset changes only `props.src` and `props.alt` while preserving node `id`, style, responsive data, and unrelated props.

- [ ] **Step 2: Run focused test and confirm it passes against the existing command**

```bash
yarn tsx --test src/shared/__tests__/inline-image-edit.test.ts
```

If it fails, fix the command first; do not work around command bugs inside the picker.

- [ ] **Step 3: Replace the current ad-hoc Image replacement Modal**

WebsiteEditor keeps only the target `imageNodeId` state and renders:

```tsx
<WebsiteAssetPicker
  open={Boolean(imageNodeId)}
  initialSrc={String(imageNode?.props.src || '')}
  initialAlt={String(imageNode?.props.alt || '')}
  onCancel={() => setImageNodeId(undefined)}
  onApply={({ src, alt }) => handleInlineImageCommit(imageNodeId!, { src, alt })}
/>
```

The commit handler calls `updateInlineImage`, replaces the document, keeps the Image selected, marks editor state dirty through the existing replace-document path, and closes the picker only after success.

- [ ] **Step 4: Update interaction docs**

Change Image double-click documentation from URL-only modal to `媒体库 / 上传图片 / 图片 URL` and document that asset-management APIs are editor-only.

- [ ] **Step 5: Build locally**

```bash
cd ~/nocobase
yarn build @lzh/plugin-website-builder
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/client/editor/WebsiteEditor.tsx src/shared/__tests__/inline-image-edit.test.ts docs/website-builder-v1-selection-interaction.md
git commit -m "feat: integrate media library with image editing"
```

---

### Task 7: Run the release gate for media assets

**Files:**
- Modify only if verification reveals a defect; otherwise no source changes.

**Interfaces:**
- Produces the acceptance evidence required before considering the media-library feature complete.

- [ ] **Step 1: Run focused regression tests**

```bash
cd ~/nocobase/packages/plugins/@lzh/plugin-website-builder
yarn tsx --test \
  src/shared/__tests__/asset-library-server-contract.test.ts \
  src/shared/__tests__/asset-api.test.ts \
  src/shared/__tests__/asset-picker-state.test.ts \
  src/shared/__tests__/inline-image-edit.test.ts
```

Expected: all PASS.

- [ ] **Step 2: Run the full plugin build**

```bash
cd ~/nocobase
yarn build @lzh/plugin-website-builder
```

Expected: exit code 0.

- [ ] **Step 3: Start NocoBase and perform editor acceptance**

```bash
yarn dev-server
```

Verify in the browser:

```text
Image double-click
→ Media Library opens
→ existing images paginate/search
→ Upload Image uploads to wbAssets and becomes selected
→ Apply updates Image immediately
→ Cancel leaves schema untouched
→ URL tab still works
→ Save Draft
→ Preview shows the image
→ Publish shows the image
```

- [ ] **Step 4: Verify security boundary in a logged-out browser**

Confirm the published image URL under `/files/.../wbAssets/...` is readable while an unauthenticated attempt to use `wbAssets:list` is not authorized/publicly enumerable.

- [ ] **Step 5: Re-check old editor interaction regressions**

Confirm Canvas selection, right-click actions, style clipboard, quick toolbar, Heading/Text/Button inline edit, DnD hierarchy, Delete/Backspace guard, Preview editor-chrome isolation all still behave as before.

- [ ] **Step 6: Final verification commit only if documentation/evidence is recorded**

If a release note/checklist file is updated, commit it separately; otherwise do not create a meaningless commit.
