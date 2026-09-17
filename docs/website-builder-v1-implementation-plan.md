# NocoBase Website Builder V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the first installable and locally verifiable NocoBase Website Builder version with page/site management, zero-code page editing, draft save, preview, publish/version persistence, and published-page rendering.

**Architecture:** Keep this repository as one NocoBase plugin package. `src/shared` owns the framework-neutral Website Schema and pure helpers; `src/client` owns FlowEngine models, editor UI, component registry, renderer and style resolution; `src/server` owns collections, services, publish/version logic and ACL. `src/client-v2` remains a thin compatibility adapter in V1.

**Tech Stack:** NocoBase 2.x, TypeScript, React, Ant Design, NocoBase FlowEngine, NocoBase Server collections/resources, Vitest-compatible unit tests.

**Spec:** `docs/website-builder-v1-design.md`

## Global Constraints

- Keep the repository as a single NocoBase plugin package; do not convert it to a monorepo.
- Source code stays under `src/`.
- Website pages are persisted as structured Website Schema, never as primary raw HTML strings.
- V1 component types are namespaced as `wb.page`, `wb.section`, `wb.container`, `wb.grid`, `wb.heading`, `wb.text`, `wb.image`, `wb.button`.
- V1 responsive modes are Desktop and Mobile.
- Editing and published runtime are separated through Draft and immutable Published Version records.
- `src/shared` must not depend on React, Ant Design, `@nocobase/client`, `@nocobase/server`, DOM, or `window`.
- V1 does not implement SSR/SSG, full CMS data binding, form builder, component marketplace, AI page generation, custom JavaScript, or advanced animation.

---

## File Structure

The first version creates only files needed for the end-to-end acceptance flow.

```text
src/
├── shared/
│   ├── schema/
│   │   ├── node.ts
│   │   ├── page.ts
│   │   ├── style.ts
│   │   ├── responsive.ts
│   │   └── index.ts
│   ├── constants/
│   │   └── breakpoints.ts
│   └── utils/
│       ├── nodeTree.ts
│       └── index.ts
├── client/
│   ├── models/
│   │   ├── WebsiteNodeModel.tsx
│   │   ├── layout.tsx
│   │   ├── content.tsx
│   │   └── index.ts
│   ├── registry/
│   │   ├── ComponentRegistry.ts
│   │   ├── builtins.tsx
│   │   └── index.ts
│   ├── renderer/
│   │   ├── styleResolver.ts
│   │   ├── WebsiteRenderer.tsx
│   │   └── index.ts
│   ├── editor/
│   │   ├── WebsiteEditor.tsx
│   │   ├── editorState.ts
│   │   └── components.tsx
│   ├── pages/
│   │   ├── WebsiteBuilderPage.tsx
│   │   └── PublishedPage.tsx
│   ├── services/
│   │   └── websiteBuilderApi.ts
│   └── plugin.tsx
├── server/
│   ├── collections/
│   │   ├── wbSites.ts
│   │   ├── wbPages.ts
│   │   ├── wbPageVersions.ts
│   │   └── index.ts
│   ├── services/
│   │   └── PublishService.ts
│   ├── resources/
│   │   └── websiteBuilder.ts
│   ├── acl/
│   │   └── index.ts
│   └── plugin.ts
└── client-v2/
    └── plugin.tsx

tests/
├── shared/nodeTree.test.ts
├── client/styleResolver.test.ts
└── server/publishService.test.ts
```

---

### Task 1: Shared Website Schema and Tree Operations

**Files:**
- Create: `src/shared/schema/style.ts`
- Create: `src/shared/schema/responsive.ts`
- Create: `src/shared/schema/node.ts`
- Create: `src/shared/schema/page.ts`
- Create: `src/shared/schema/index.ts`
- Create: `src/shared/constants/breakpoints.ts`
- Create: `src/shared/utils/nodeTree.ts`
- Create: `src/shared/utils/index.ts`
- Create: `tests/shared/nodeTree.test.ts`

**Interfaces:**
- Produces: `WebsiteNode`, `WebsitePageSchema`, `WebsiteStyle`, `ResponsiveStyle`, `findNode`, `replaceNode`, `insertChild`, `removeNode`.

- [ ] **Step 1: Write failing tree-operation tests** covering nested lookup, immutable replacement, insertion and removal.
- [ ] **Step 2: Run the focused test and confirm failure because helpers do not exist.**
- [ ] **Step 3: Implement schema types and pure immutable tree helpers.**
- [ ] **Step 4: Run focused tests and confirm pass.**
- [ ] **Step 5: Commit:** `feat(shared): add website schema and tree operations`.

Representative contract:

```ts
export interface WebsiteNode {
  id: string;
  type: WebsiteNodeType;
  props: Record<string, unknown>;
  style: WebsiteStyle;
  responsive?: ResponsiveStyle;
  children: WebsiteNode[];
}

export function replaceNode(root: WebsiteNode, node: WebsiteNode): WebsiteNode;
export function insertChild(root: WebsiteNode, parentId: string, child: WebsiteNode, index?: number): WebsiteNode;
export function removeNode(root: WebsiteNode, nodeId: string): WebsiteNode;
```

---

### Task 2: Style Resolution and Component Registry

**Files:**
- Create: `src/client/renderer/styleResolver.ts`
- Create: `src/client/registry/ComponentRegistry.ts`
- Create: `src/client/registry/builtins.tsx`
- Create: `src/client/registry/index.ts`
- Create: `tests/client/styleResolver.test.ts`

**Interfaces:**
- Consumes: `WebsiteNode`, `WebsiteStyle`, `ResponsiveStyle` from Task 1.
- Produces: `resolveNodeStyle(node, device)`, `ComponentRegistry.register/get/list`.

- [ ] **Step 1: Write failing tests** proving mobile overrides base style while desktop preserves base values.
- [ ] **Step 2: Run focused tests and confirm failure.**
- [ ] **Step 3: Implement deep style merge for the supported style groups.**
- [ ] **Step 4: Implement registry with duplicate-type protection and built-in metadata for eight V1 node types.**
- [ ] **Step 5: Run focused tests and confirm pass.**
- [ ] **Step 6: Commit:** `feat(client): add style resolver and component registry`.

---

### Task 3: Renderer for the Eight V1 Components

**Files:**
- Create: `src/client/renderer/WebsiteRenderer.tsx`
- Create: `src/client/renderer/index.ts`
- Modify: `src/client/registry/builtins.tsx`

**Interfaces:**
- Consumes: registry and style resolver from Task 2.
- Produces: `<WebsiteRenderer schema device />` and recursive node rendering.

- [ ] **Step 1: Add renderer tests or lightweight render assertions for Heading/Text/Image/Button and nested Section/Container/Grid.**
- [ ] **Step 2: Run them and confirm failure.**
- [ ] **Step 3: Implement recursive rendering with unknown-component fallback instead of throwing.**
- [ ] **Step 4: Verify Desktop/Mobile style resolution reaches rendered nodes.**
- [ ] **Step 5: Commit:** `feat(client): render website schema components`.

---

### Task 4: Server Persistence Model and Publish Service

**Files:**
- Create: `src/server/collections/wbSites.ts`
- Create: `src/server/collections/wbPages.ts`
- Create: `src/server/collections/wbPageVersions.ts`
- Create: `src/server/collections/index.ts`
- Create: `src/server/services/PublishService.ts`
- Create: `tests/server/publishService.test.ts`

**Interfaces:**
- Produces collections `wbSites`, `wbPages`, `wbPageVersions` and `PublishService.publish(pageId, userId, note?)`.
- A page owns editable `draftSchema`; a published version stores an immutable schema snapshot and the page stores `publishedVersionId`.

- [ ] **Step 1: Write failing PublishService tests using repository doubles** for sequential version creation and snapshot immutability.
- [ ] **Step 2: Run focused tests and confirm failure.**
- [ ] **Step 3: Define the three collections with relationships and JSON fields.**
- [ ] **Step 4: Implement publish logic using a transaction where supported by the injected repository/database boundary.**
- [ ] **Step 5: Run tests and confirm pass.**
- [ ] **Step 6: Commit:** `feat(server): persist drafts and published versions`.

---

### Task 5: Website Builder Server Resource and ACL

**Files:**
- Create: `src/server/resources/websiteBuilder.ts`
- Create: `src/server/acl/index.ts`
- Modify: `src/server/plugin.ts`

**Interfaces:**
- Produces authenticated actions for page/site CRUD plus `publish`, and a read-only published-page action.
- ACL roles/actions: `websiteBuilder:view`, `websiteBuilder:edit`, `websiteBuilder:publish`.

- [ ] **Step 1: Register collections during plugin load.**
- [ ] **Step 2: Register custom publish and published-page resource actions.**
- [ ] **Step 3: Register ACL snippets/actions without granting anonymous mutation access.**
- [ ] **Step 4: Add server integration smoke coverage where the NocoBase test harness is available.**
- [ ] **Step 5: Commit:** `feat(server): expose website builder resources and acl`.

---

### Task 6: FlowModels and FlowEngine Registration

**Files:**
- Create: `src/client/models/WebsiteNodeModel.tsx`
- Create: `src/client/models/layout.tsx`
- Create: `src/client/models/content.tsx`
- Modify: `src/client/models/index.ts`
- Modify: `src/client/plugin.tsx`

**Interfaces:**
- Produces FlowModel classes mapped to all eight V1 component types and keeps registration through `this.flowEngine.registerModels(models)`.

- [ ] **Step 1: Add model construction/registration assertions where the FlowEngine test harness can be imported.**
- [ ] **Step 2: Implement the minimal base model and V1 model subclasses.**
- [ ] **Step 3: Export the constructor map from `src/client/models/index.ts`.**
- [ ] **Step 4: Register models at plugin load.**
- [ ] **Step 5: Commit:** `feat(client): register website builder flow models`.

---

### Task 7: Zero-Code Editor MVP

**Files:**
- Create: `src/client/editor/editorState.ts`
- Create: `src/client/editor/components.tsx`
- Create: `src/client/editor/WebsiteEditor.tsx`
- Create: `src/client/services/websiteBuilderApi.ts`

**Interfaces:**
- Consumes: Website Schema, registry and renderer.
- Produces the V1 editor with component palette, canvas, property panel, device switcher, save draft and publish actions.

- [ ] **Step 1: Implement editor state as immutable schema updates using Task 1 helpers.**
- [ ] **Step 2: Implement the component palette for Section/Container/Grid/Heading/Text/Image/Button.**
- [ ] **Step 3: Implement click-to-select canvas rendering and selected-node highlight.**
- [ ] **Step 4: Implement content/style fields for the V1 acceptance properties.**
- [ ] **Step 5: Implement Desktop/Mobile mode and write changes into base/mobile style locations.**
- [ ] **Step 6: Implement save-draft and publish API calls with visible success/error state.**
- [ ] **Step 7: Commit:** `feat(client): add zero-code website editor`.

V1 deliberately uses deterministic add/select/reorder controls before advanced drag-and-drop behavior; this preserves a complete zero-code acceptance loop without coupling the first release to a second drag-and-drop framework.

---

### Task 8: NocoBase Management Entry and Published Page Route

**Files:**
- Create: `src/client/pages/WebsiteBuilderPage.tsx`
- Create: `src/client/pages/PublishedPage.tsx`
- Modify: `src/client/plugin.tsx`
- Modify: `src/locale/zh-CN.json`
- Modify: `src/locale/en-US.json`

**Interfaces:**
- Produces a NocoBase management route/menu entry and a public/read-only route that loads a published version into `WebsiteRenderer`.

- [ ] **Step 1: Register the admin page through the NocoBase 2.x route/settings API verified against the current upstream source.**
- [ ] **Step 2: Add site/page list-and-edit navigation sufficient for V1 local acceptance.**
- [ ] **Step 3: Register the published-page route with read-only loading.**
- [ ] **Step 4: Add Chinese and English labels.**
- [ ] **Step 5: Commit:** `feat(client): add website builder routes and pages`.

---

### Task 9: Client-v2 Compatibility Boundary

**Files:**
- Modify: `src/client-v2/plugin.tsx`
- Create only if required: `src/client-v2/adapters/index.ts`

**Interfaces:**
- Keeps V1 from maintaining a duplicate editor while providing a clear compatibility/migration boundary.

- [ ] **Step 1: Keep the v2 plugin side-effect free unless a verified NocoBase API requires registration.**
- [ ] **Step 2: Document the compatibility boundary in code comments and README.**
- [ ] **Step 3: Commit:** `chore(client-v2): define website builder compatibility boundary`.

---

### Task 10: Release Gate and Local Acceptance Documentation

**Files:**
- Modify: `README.md`
- Create: `docs/website-builder-v1-local-acceptance.md`

**Interfaces:**
- Produces repeatable installation/acceptance instructions for the user's local NocoBase repository.

- [ ] **Step 1: Run all available unit tests.**
- [ ] **Step 2: Run TypeScript/build validation in an actual NocoBase 2.x workspace or equivalent dependency-installed plugin workspace.**
- [ ] **Step 3: Verify no generated `dist` files or dependency folders are accidentally committed.**
- [ ] **Step 4: Write exact local installation, enablement and acceptance steps.**
- [ ] **Step 5: Verify the V1 acceptance checklist: admin entry, site/page create, editor, eight components, Desktop/Mobile style editing, draft save, preview, publish, published rendering, version creation, ACL.**
- [ ] **Step 6: Commit:** `docs: add v1 installation and acceptance guide`.
- [ ] **Step 7: Fast-forward `master` only after the verified V1 feature branch passes the release gate.**

## Release Gate

V1 is complete only when all applicable checks are green and no known blocker remains for local installation acceptance. If full NocoBase runtime verification cannot be executed in the remote environment, the exact unverified checks must be called out in `docs/website-builder-v1-local-acceptance.md`, and `master` must not be described as runtime-verified until the user completes local acceptance.
