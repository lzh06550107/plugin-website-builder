# NocoBase Website Builder V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 `@lzh/plugin-website-builder` 单插件骨架内完成第一个可安装验收版本：NocoBase 后台可管理 Site/Page、进入零代码页面编辑器、编辑基础组件与样式、保存 Draft、预览、发布并通过 Renderer 渲染 Published Version。

**Architecture:** 保持仓库为单个 NocoBase 插件包。`src/shared` 定义与 NocoBase/React 解耦的 Website Schema；`src/client` 承担 FlowEngine 接入、编辑器、Registry 和 Renderer；`src/server` 承担 Collection、服务、发布版本和 ACL；`src/client-v2` V1 只保留适配入口。页面源数据保存为结构化组件树，不保存最终 HTML。

**Tech Stack:** TypeScript, React, Ant Design, NocoBase 2.x (`@nocobase/client`, `@nocobase/server`, FlowEngine), NocoBase Collection/Resource/ACL。

**Spec:** `docs/website-builder-v1-design.md`

## Global Constraints

- 仓库保持单插件结构，不改造成 monorepo。
- V1 主实现放在 `src/client`；`src/client-v2` 不重复实现编辑器。
- Website Schema 不依赖 React、DOM、`@nocobase/client` 或 `@nocobase/server`。
- 页面持久化格式为结构化组件树，不以 HTML 字符串作为源数据。
- 组件类型统一使用 `wb.*` 命名空间。
- V1 支持 `Page / Section / Container / Grid / Heading / Text / Image / Button`。
- V1 响应式只实现 Desktop / Mobile。
- Draft 与 Published Version 分离；发布生成不可变版本。
- V1 至少提供查看、编辑、发布三类权限。
- 第一版完成后必须提供本地安装与人工验收文档并提醒用户执行验收。

---

## File map

### Shared domain
- `src/shared/schema/types.ts`: Website Node、Style、Responsive、Page Draft 等核心类型。
- `src/shared/schema/defaults.ts`: 根页面与基础节点默认值。
- `src/shared/schema/validate.ts`: V1 Schema 校验。
- `src/shared/schema/index.ts`: shared schema public API。

### Client core
- `src/client/registry/*`: 组件定义注册表。
- `src/client/renderer/*`: Schema -> React 渲染与 Style DSL 转换。
- `src/client/editor/state/*`: 编辑器 reducer、选择态、设备态。
- `src/client/editor/commands/*`: 插入、更新、删除、移动节点纯命令。
- `src/client/editor/*`: 左中右编辑器、工具栏、Canvas、属性面板。
- `src/client/models/*`: FlowModel 注册入口与基础 Website Node 模型。
- `src/client/plugin.tsx`: 注册 models、路由/页面入口。

### Server
- `src/server/collections/*`: `wbSites`、`wbPages`、`wbPageVersions`、`wbThemes`。
- `src/server/services/*`: Draft、Publish、Version 业务逻辑。
- `src/server/plugin.ts`: collection import、resource action、ACL 注册。

### Docs/tests
- `src/shared/__tests__/*`: Schema/命令/Style 纯逻辑测试。
- `docs/website-builder-v1-acceptance.md`: 本地部署安装与人工验收清单。

---

### Task 1: Shared Website Schema and pure tree operations

**Files:**
- Create: `src/shared/schema/types.ts`
- Create: `src/shared/schema/defaults.ts`
- Create: `src/shared/schema/validate.ts`
- Create: `src/shared/schema/index.ts`
- Create: `src/shared/tree/index.ts`
- Create: `src/shared/__tests__/schema.test.ts`

**Interfaces:**
- Produces `WebsiteNode`, `WebsiteStyle`, `ResponsiveStyle`, `DeviceType`, `createPageRoot()`, `createNode()`, `validateWebsiteNode()`, `findNode()`, `updateNode()`, `insertNode()`, `removeNode()`.

- [ ] Write tests covering valid root creation, namespaced type validation, recursive node lookup, immutable update, insert and delete.
- [ ] Run shared tests and confirm they fail before implementation.
- [ ] Implement minimal typed schema and pure tree commands.
- [ ] Run tests and confirm pass.
- [ ] Commit as `feat: add website schema core`.

### Task 2: Component registry, style resolver and Renderer

**Files:**
- Create: `src/client/registry/types.ts`
- Create: `src/client/registry/ComponentRegistry.ts`
- Create: `src/client/registry/builtins.tsx`
- Create: `src/client/registry/index.ts`
- Create: `src/client/renderer/style.ts`
- Create: `src/client/renderer/NodeRenderer.tsx`
- Create: `src/client/renderer/WebsiteRenderer.tsx`
- Create: `src/client/renderer/index.ts`
- Create: `src/shared/__tests__/style.test.ts`

**Interfaces:**
- Consumes `WebsiteNode`, `WebsiteStyle`, `DeviceType`.
- Produces `componentRegistry`, `resolveNodeStyle(node, device)`, `WebsiteRenderer`.

- [ ] Write style merge tests for Desktop and Mobile inheritance.
- [ ] Verify failing test.
- [ ] Implement style resolver.
- [ ] Implement registry with eight V1 built-ins.
- [ ] Implement recursive renderer with unknown-component fallback.
- [ ] Run tests/type checks available in the repository.
- [ ] Commit as `feat: add component registry and renderer`.

### Task 3: Editor state and commands

**Files:**
- Create: `src/client/editor/state/types.ts`
- Create: `src/client/editor/state/reducer.ts`
- Create: `src/client/editor/state/index.ts`
- Create: `src/client/editor/commands/index.ts`
- Create: `src/shared/__tests__/editor-commands.test.ts`

**Interfaces:**
- Produces editor actions: select node, set device, replace document, update selected props/style, insert child, remove node.

- [ ] Write reducer/command tests for selection preservation and immutable document updates.
- [ ] Verify tests fail.
- [ ] Implement reducer and commands using shared tree operations.
- [ ] Verify tests pass.
- [ ] Commit as `feat: add website editor state`.

### Task 4: Visual editor shell and property editing

**Files:**
- Create: `src/client/editor/WebsiteEditor.tsx`
- Create: `src/client/editor/toolbar/EditorToolbar.tsx`
- Create: `src/client/editor/panels/ComponentPanel.tsx`
- Create: `src/client/editor/panels/PropertyPanel.tsx`
- Create: `src/client/editor/canvas/Canvas.tsx`
- Create: `src/client/editor/index.ts`

**Interfaces:**
- Consumes editor state, registry and renderer.
- Produces usable three-column editor: component insertion, node selection, text/image/button content editing, common style editing, Desktop/Mobile switching.

- [ ] Add editor shell with top toolbar + left component panel + center canvas + right properties.
- [ ] Implement click-to-select and visible selected-node outline.
- [ ] Implement insertion of V1 nodes into selected container/root.
- [ ] Implement property forms for content and basic layout/style fields.
- [ ] Implement Desktop/Mobile device editing.
- [ ] Run build/type validation available locally.
- [ ] Commit as `feat: add visual page editor`.

### Task 5: NocoBase FlowModel integration

**Files:**
- Create/Modify: `src/client/models/base/WebsiteNodeModel.tsx`
- Create: `src/client/models/layout/*.tsx`
- Create: `src/client/models/content/*.tsx`
- Modify: `src/client/models/index.ts`
- Create: `src/client/flows/index.ts`

**Interfaces:**
- Consumes component registry and Website Schema.
- Produces registered FlowModel constructors for eight V1 component types and V1 Content/Layout/Style/Responsive configuration hooks.

- [ ] Confirm current NocoBase FlowModel constructor/API names against current 2.x source.
- [ ] Implement smallest compatible WebsiteNodeModel abstraction.
- [ ] Implement eight model classes and register them through existing `this.flowEngine.registerModels(models)`.
- [ ] Keep Website Schema as domain format; FlowModel acts as edit adapter only.
- [ ] Run build/type validation.
- [ ] Commit as `feat: integrate website models with flow engine`.

### Task 6: Server collections and persistence

**Files:**
- Create: `src/server/collections/wbSites.ts`
- Create: `src/server/collections/wbPages.ts`
- Create: `src/server/collections/wbPageVersions.ts`
- Create: `src/server/collections/wbThemes.ts`
- Create: `src/server/collections/index.ts`
- Modify: `src/server/plugin.ts`

**Interfaces:**
- Produces collections `wbSites`, `wbPages`, `wbPageVersions`, `wbThemes`.
- `wbPages.draftSchema` stores editable Website Schema JSON.
- `wbPages.publishedVersionId` identifies active published version.

- [ ] Define collections using current NocoBase 2.x collection syntax.
- [ ] Add relations: Site -> Pages, Page -> Versions, Site -> Theme.
- [ ] Add indexes/unique constraints for site key and page route identity.
- [ ] Import/register collections from server plugin.
- [ ] Run server schema/build validation.
- [ ] Commit as `feat: add website persistence collections`.

### Task 7: Publish service, API actions and ACL

**Files:**
- Create: `src/server/services/PageService.ts`
- Create: `src/server/services/PublishService.ts`
- Create: `src/server/resources/website.ts`
- Create: `src/server/acl/index.ts`
- Modify: `src/server/plugin.ts`

**Interfaces:**
- Produces actions for draft save/read, preview read, publish and published read.
- Publish validates draft schema, creates immutable `wbPageVersions` record, updates `publishedVersionId` transactionally.

- [ ] Implement schema validation guard before persistence/publish.
- [ ] Implement `saveDraft(pageId, schema)`.
- [ ] Implement `publish(pageId, publishNote?)` in transaction.
- [ ] Implement read API for draft and published version.
- [ ] Register ACL actions: view/edit/publish.
- [ ] Run server tests/build validation.
- [ ] Commit as `feat: add draft and publish workflow`.

### Task 8: NocoBase management pages and editor API wiring

**Files:**
- Create: `src/client/pages/WebsiteListPage.tsx`
- Create: `src/client/pages/PageListPage.tsx`
- Create: `src/client/pages/PageEditorPage.tsx`
- Create: `src/client/services/websiteApi.ts`
- Modify: `src/client/plugin.tsx`
- Update: `src/locale/zh-CN.json`
- Update: `src/locale/en-US.json`

**Interfaces:**
- Produces NocoBase backend entry and route flow: Website Builder -> Sites -> Pages -> Editor.
- Editor loads/saves draft and invokes publish action.

- [ ] Add management route/menu using current NocoBase 2.x client API.
- [ ] Implement site/page list and create actions sufficient for V1 acceptance.
- [ ] Wire PageEditorPage to draft load/save/publish APIs.
- [ ] Add save/publish success/error feedback.
- [ ] Add localization strings.
- [ ] Run build/type validation.
- [ ] Commit as `feat: wire website builder management ui`.

### Task 9: Public/preview render path and V1 acceptance docs

**Files:**
- Create: `src/client/pages/PreviewPage.tsx`
- Create or Modify: server resource for published route/schema delivery.
- Update: `README.md`
- Create: `docs/website-builder-v1-acceptance.md`

**Interfaces:**
- Preview renders draft.
- Published renderer reads only immutable published version.

- [ ] Implement draft preview route.
- [ ] Implement published schema render route/API for V1.
- [ ] Ensure unpublished edits do not affect published page.
- [ ] Document local NocoBase installation/link/build/enable steps.
- [ ] Document manual acceptance cases for Site/Page/editor/components/styles/responsive/save/preview/publish/version isolation/ACL.
- [ ] Run full available validation.
- [ ] Commit as `docs: add v1 deployment and acceptance guide`.

### Task 10: Release gate

**Files:**
- Modify only files required by verification failures.

- [ ] Review `docs/website-builder-v1-design.md` requirement-by-requirement against implementation.
- [ ] Run repository build/typecheck/test commands in an actual NocoBase 2.x workspace where available.
- [ ] Confirm generated package entry points remain compatible with `client.js`, `client-v2.js`, and `server.js`.
- [ ] Confirm no direct HTML-string page persistence was introduced.
- [ ] Confirm Draft and Published data are isolated.
- [ ] Record known V1 limitations in acceptance doc.
- [ ] Commit any release-gate fixes.
- [ ] Notify user that V1 is ready for local deployment/install acceptance, with exact commands and checklist.
