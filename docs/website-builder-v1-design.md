# NocoBase Website Builder V1 设计文档

## 1. 目标

本插件的目标是在 NocoBase 后台提供一个零代码网站构建器，使运营人员无需编写 HTML、CSS、JavaScript，即可完成前台网站页面的创建、排版、样式配置、响应式配置、预览、发布和版本回滚。

V1 的目标不是一次实现完整 Webflow/Elementor，而是完成一个可安装、可运行、可编辑、可保存、可预览、可发布的最小闭环。

---

## 2. V1 验收范围

V1 必须至少完成以下能力：

1. NocoBase 后台可进入 Website Builder 管理入口。
2. 可创建网站（Site）。
3. 可创建页面（Page）。
4. 页面可进入可视化编辑器。
5. 编辑器具备左侧组件面板、中间 Canvas、右侧属性面板、顶部工具栏。
6. 支持基础组件：
   - Page
   - Section
   - Container
   - Grid
   - Heading
   - Text
   - Image
   - Button
7. 支持基础排版和样式：
   - width / maxWidth / minHeight
   - margin / padding
   - display
   - flex / grid 基础配置
   - background
   - color
   - fontSize / fontWeight / lineHeight / textAlign
   - border / borderRadius
8. 支持 Desktop / Mobile 两个响应式断点。
9. 页面配置可保存为 Draft。
10. 可预览 Draft。
11. 可发布为 Published Version。
12. 前台 Renderer 可读取已发布版本并渲染。
13. 支持版本记录，为后续回滚提供基础。
14. 最低限度权限控制：查看、编辑、发布。

V1 暂不实现：

- 高级动画
- 自定义 JavaScript
- 第三方组件市场
- 多语言站点内容
- SSR/SSG 独立运行时
- 完整 CMS 数据绑定
- 表单系统
- 高级模板市场
- AI 页面生成

这些能力进入后续版本。

---

## 3. 当前仓库约束

当前仓库：

```text
lzh06550107/plugin-website-builder
```

当前项目是单个 NocoBase 插件包，不改造成 monorepo。

现有根目录结构保留：

```text
plugin-website-builder/
├── package.json
├── client.js
├── client.d.ts
├── client-v2.js
├── client-v2.d.ts
├── server.js
├── server.d.ts
├── README.md
└── src/
```

源码继续统一放在 `src/` 中。

---

## 4. 总体架构

整体划分为四层：

```text
┌─────────────────────────────────────────────┐
│                  shared                     │
│ Schema / Types / Constants / Pure Utils     │
└──────────────────────┬──────────────────────┘
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
┌────────────────────┐  ┌─────────────────────┐
│       client       │  │       server        │
│                    │  │                     │
│ FlowModel          │  │ Collections         │
│ Flow               │  │ Resources           │
│ Editor             │  │ Services            │
│ Renderer           │  │ Publish             │
│ Registry           │  │ ACL                 │
└──────────┬─────────┘  └─────────────────────┘
           │
           ▼
┌────────────────────┐
│     client-v2      │
│      Adapter       │
└────────────────────┘
```

### 4.1 `src/shared`

只保存纯领域模型与数据协议。

禁止依赖：

- React
- Ant Design
- `@nocobase/client`
- `@nocobase/server`
- DOM
- `window`

主要内容：

- Page Schema
- Node Schema
- Style Schema
- Responsive Schema
- Theme Schema
- Binding Schema
- Event Schema
- 公共类型
- 纯函数

### 4.2 `src/client`

V1 的 Website Builder 主实现。

当前仓库已经在 `src/client/plugin.tsx` 中接入 `this.flowEngine.registerModels(models)`，因此 V1 继续以 `src/client` 作为主要 FlowEngine 实现入口。

职责：

- FlowModel
- Flow
- Editor
- Canvas
- Component Registry
- Renderer
- Style Resolver
- 响应式编辑

### 4.3 `src/client-v2`

V1 保持轻量适配层，不重复维护一套编辑器。

职责：

- 后续 client-v2 迁移入口
- 必要适配器

### 4.4 `src/server`

职责：

- Collection 定义
- API / Resource
- Page / Site 服务
- Draft 保存
- Preview
- Publish
- Version
- ACL

---

## 5. 目标目录结构

```text
src/
├── index.ts
│
├── locale/
│   ├── zh-CN.json
│   └── en-US.json
│
├── shared/
│   ├── schema/
│   │   ├── site.ts
│   │   ├── page.ts
│   │   ├── node.ts
│   │   ├── style.ts
│   │   ├── responsive.ts
│   │   ├── binding.ts
│   │   ├── event.ts
│   │   ├── theme.ts
│   │   └── index.ts
│   ├── types/
│   ├── constants/
│   └── utils/
│
├── client/
│   ├── index.tsx
│   ├── plugin.tsx
│   ├── locale.ts
│   │
│   ├── models/
│   │   ├── base/
│   │   ├── layout/
│   │   ├── content/
│   │   └── index.ts
│   │
│   ├── flows/
│   │   ├── content/
│   │   ├── layout/
│   │   ├── style/
│   │   ├── responsive/
│   │   └── index.ts
│   │
│   ├── editor/
│   │   ├── toolbar/
│   │   ├── canvas/
│   │   ├── panels/
│   │   └── commands/
│   │
│   ├── components/
│   ├── registry/
│   ├── renderer/
│   ├── styles/
│   ├── pages/
│   ├── services/
│   └── hooks/
│
├── client-v2/
│   ├── index.tsx
│   ├── plugin.tsx
│   └── adapters/
│
└── server/
    ├── index.ts
    ├── plugin.ts
    ├── collections/
    ├── resources/
    ├── services/
    ├── acl/
    ├── validators/
    └── migrations/
```

V1 实施过程中只创建实际需要的目录和文件，避免一次性创建大量空目录。

---

## 6. Website Schema

网页不保存最终 HTML，而保存结构化组件树。

示例：

```json
{
  "type": "wb.page",
  "id": "page-root",
  "props": {},
  "style": {},
  "responsive": {},
  "children": [
    {
      "type": "wb.section",
      "id": "section-1",
      "props": {},
      "style": {},
      "responsive": {},
      "children": [
        {
          "type": "wb.heading",
          "id": "heading-1",
          "props": {
            "text": "Hello Website Builder",
            "level": 2
          },
          "style": {},
          "responsive": {},
          "children": []
        }
      ]
    }
  ]
}
```

核心原则：

```text
Schema 是源数据
HTML/React DOM 是渲染结果
```

不得直接以 HTML 字符串作为页面的主要持久化格式。

---

## 7. Node 数据结构

基础 Node：

```ts
interface WebsiteNode {
  id: string;
  type: string;
  props: Record<string, unknown>;
  style: WebsiteStyle;
  responsive?: ResponsiveStyle;
  children?: WebsiteNode[];
}
```

V1 组件 type 统一使用命名空间：

```text
wb.page
wb.section
wb.container
wb.grid
wb.heading
wb.text
wb.image
wb.button
```

避免未来与其他插件组件发生冲突。

---

## 8. FlowEngine 与 Website Schema 的关系

FlowEngine 用于编辑时配置，不作为 Website Builder 唯一业务数据格式。

```text
Website Schema
      │
      ├──────────────────┐
      ▼                  ▼
FlowModel             Renderer
      │                  │
      ▼                  ▼
Editor              Public Page
```

职责划分：

### FlowModel

负责：

- 编辑态组件模型
- 配置 Flow
- 属性编辑
- 编辑器交互

### Website Schema

负责：

- 网站业务数据
- Draft
- Publish
- Version
- Renderer 输入
- 后续导入导出

这样可以避免 Website Builder 业务格式与 NocoBase FlowEngine 内部实现强耦合。

---

## 9. FlowModel 设计

基础模型：

```text
WebsiteNodeModel
```

布局模型：

```text
PageModel
SectionModel
ContainerModel
GridModel
```

内容模型：

```text
HeadingModel
TextModel
ImageModel
ButtonModel
```

统一在：

```text
src/client/models/index.ts
```

导出，并继续使用当前插件中的：

```ts
this.flowEngine.registerModels(models);
```

进行注册。

---

## 10. Flow 设计

V1 只实现四类 Flow：

```text
ContentFlow
LayoutFlow
StyleFlow
ResponsiveFlow
```

### ContentFlow

编辑：

- 文本
- 标题级别
- 图片地址
- Button 文案
- Button Link

### LayoutFlow

编辑：

- width
- maxWidth
- minHeight
- display
- flex
- grid
- align
- justify
- gap

### StyleFlow

编辑：

- color
- background
- typography
- margin
- padding
- border
- borderRadius

### ResponsiveFlow

V1 支持：

```text
Desktop
Mobile
```

后续增加 Tablet。

---

## 11. Style DSL

不使用一个大的 CSS 文本框作为主要样式配置方式。

示例：

```ts
interface WebsiteStyle {
  layout?: {
    width?: string;
    maxWidth?: string;
    minHeight?: string;
    display?: string;
  };
  spacing?: {
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
  };
  typography?: {
    color?: string;
    fontSize?: string;
    fontWeight?: string | number;
    lineHeight?: string | number;
    textAlign?: string;
  };
  background?: {
    color?: string;
    image?: string;
  };
  border?: {
    width?: string;
    style?: string;
    color?: string;
    radius?: string;
  };
}
```

Renderer 负责转换为最终 React Style / CSS。

---

## 12. 响应式设计

V1 数据结构：

```ts
interface ResponsiveStyle {
  desktop?: Partial<WebsiteStyle>;
  mobile?: Partial<WebsiteStyle>;
}
```

解析规则：

```text
组件默认样式
    ↓
base style
    ↓
device style
```

用户切换 Desktop / Mobile 时，只编辑对应设备覆盖项。

---

## 13. 编辑器布局

```text
┌─────────────────────────────────────────────────────────────┐
│ 页面 / Desktop-Mobile / Undo-Redo / Preview / Save / Publish│
├────────────┬─────────────────────────────┬──────────────────┤
│            │                             │                  │
│ 组件       │                             │ 属性             │
│            │          Canvas             │                  │
│ Section    │                             │ 内容             │
│ Container  │                             │ 布局             │
│ Grid       │                             │ 样式             │
│ Heading    │                             │ 响应式           │
│ Text       │                             │                  │
│ Image      │                             │                  │
│ Button     │                             │                  │
│            │                             │                  │
├────────────┴─────────────────────────────┴──────────────────┤
│ Page > Section > Container > Heading                        │
└─────────────────────────────────────────────────────────────┘
```

主要模块：

```text
WebsiteEditor
EditorToolbar
ComponentPanel
CanvasFrame
PropertyPanel
```

---

## 14. Canvas

V1 优先采用 iframe 隔离 Canvas。

原因：

- 隔离 NocoBase / Ant Design 后台 CSS
- 隔离前台 Website CSS
- 更接近真实前台运行环境
- 后续支持独立 Renderer 更容易

核心通信统一通过：

```text
CanvasBridge
```

禁止在组件中散落 `window.postMessage` 调用。

事件包括：

```text
frameReady
nodeClick
nodeHover
selectNode
updateNode
insertNode
moveNode
deleteNode
viewportChanged
```

---

## 15. Component Registry

所有组件必须通过 Registry 注册，避免 Renderer / Editor 中出现大量 `if (type === ...)`。

示例：

```ts
interface WebsiteComponentDefinition {
  type: string;
  label: string;
  category: string;
  model: unknown;
  renderer: unknown;
  defaultProps: Record<string, unknown>;
  defaultStyle: WebsiteStyle;
  allowedChildren?: string[];
}
```

V1 内置：

```text
wb.page
wb.section
wb.container
wb.grid
wb.heading
wb.text
wb.image
wb.button
```

未来其他插件可以通过扩展接口注册：

```text
wb.product-list
wb.article-list
wb.carousel
wb.form
```

---

## 16. Renderer

Renderer 与 Editor 物理分离。

```text
src/client/renderer/
```

职责：

```text
Website Schema
      ↓
Component Registry
      ↓
React Components
      ↓
DOM
```

前台渲染不依赖：

- ComponentPanel
- PropertyPanel
- 拖拽逻辑
- Selection Overlay
- Flow 设置 UI

---

## 17. 数据表设计

V1 仅创建必要表：

### 17.1 `wb_sites`

字段：

```text
id
name
key
status
settings
createdAt
updatedAt
```

### 17.2 `wb_pages`

字段：

```text
id
siteId
name
title
slug
status
draftSchema
publishedVersionId
seoTitle
seoDescription
createdAt
updatedAt
```

### 17.3 `wb_page_versions`

字段：

```text
id
pageId
version
schema
publishNote
createdBy
createdAt
```

### 17.4 `wb_themes`

字段：

```text
id
siteId
name
tokens
breakpoints
createdAt
updatedAt
```

V1 不创建数据库组件市场表。

Component Registry 首先是代码注册表。

---

## 18. Draft / Preview / Publish

禁止直接编辑线上 Published 数据。

流程：

```text
Published V1
     │
     ├──────────────→ 前台访问 V1
     │
     ▼
   Draft
     │
   编辑
     │
   保存
     │
   Preview
     │
   Publish
     ▼
Published V2
```

发布时：

1. 读取 Page Draft Schema。
2. 校验 Schema。
3. 创建 `wb_page_versions` 新版本。
4. 更新 `wb_pages.publishedVersionId`。
5. 前台开始读取新版本。

历史版本保留，为后续 Rollback 提供基础。

---

## 19. Server 分层

### Collections

只负责数据库结构。

```text
src/server/collections
```

### Resources

负责 HTTP/API Action。

```text
src/server/resources
```

### Services

负责业务逻辑。

```text
src/server/services
```

发布逻辑必须：

```text
publish resource
      ↓
PublishService
      ↓
Schema Validator
      ↓
PageVersion
```

禁止把全部业务逻辑直接写在 Resource Handler 中。

---

## 20. 权限

V1 至少定义：

```text
websiteBuilder.view
websiteBuilder.edit
websiteBuilder.publish
```

后续可细化：

```text
websiteBuilder.page.create
websiteBuilder.page.delete
websiteBuilder.theme.manage
websiteBuilder.template.manage
```

---

## 21. 错误处理

必须覆盖：

- Schema 非法
- 未知组件类型
- 页面不存在
- Site 不存在
- Published Version 不存在
- Publish 权限不足
- Draft 保存失败
- iframe Canvas 初始化失败

原则：

- 编辑器错误不能导致整个 NocoBase 后台崩溃。
- Renderer 遇到未知节点时应输出可诊断占位结果，而不是导致整页白屏。
- Publish 必须先验证再写版本。

---

## 22. 测试策略

V1 遵循：

```text
Acceptance Criteria
      ↓
Unit Test
      ↓
Service/API Test
      ↓
Editor Component Test
      ↓
Integration
      ↓
Manual Acceptance
```

重点测试：

### Shared

- Tree 操作
- Schema 校验
- Style 合并
- Responsive 合并

### Server

- 创建 Site
- 创建 Page
- 保存 Draft
- Publish
- Version 递增
- 权限

### Client

- Registry 注册
- Renderer 节点渲染
- Style Resolver
- Desktop/Mobile 切换
- 基础组件配置

### 手工验收

最终必须在真实 NocoBase 本地环境安装插件进行验收。

---

## 23. V1 最小用户路径

```text
安装插件
    ↓
启用插件
    ↓
进入 Website Builder
    ↓
创建 Site
    ↓
创建 Page
    ↓
进入 Editor
    ↓
添加 Section
    ↓
添加 Container
    ↓
添加 Heading / Text / Image / Button
    ↓
修改布局和样式
    ↓
切换 Desktop / Mobile
    ↓
保存 Draft
    ↓
Preview
    ↓
Publish
    ↓
访问 Published Renderer
```

此流程全部通过即认为 V1 达到第一阶段本地安装验收条件。

---

## 24. 实施顺序

建议严格按以下顺序开发：

1. Shared Schema / Types
2. Server Collections
3. Server Page/Site Service
4. Draft / Publish / Version API
5. Component Registry
6. Base FlowModel
7. 基础 Layout Models
8. 基础 Content Models
9. Style / Responsive Resolver
10. Renderer
11. Editor Shell
12. Component Panel
13. Canvas
14. Property Panel
15. Save / Preview / Publish UI
16. 自动测试
17. README / 本地安装说明
18. 本地部署安装验收

---

## 25. V1 完成定义

满足以下条件才允许标记 V1 完成：

- 代码已提交到 `lzh06550107/plugin-website-builder`。
- 目录结构符合本文档。
- 插件可以完成构建。
- Server Collection 能正确注册。
- 页面 Draft 可保存。
- 页面可发布并生成 Version。
- Renderer 可渲染 Published Schema。
- Editor 可编辑至少 8 个基础组件。
- Desktop / Mobile 样式可分别保存并渲染。
- 自动测试通过。
- README 包含本地安装方式。
- `docs/` 包含设计、实现说明与本地验收清单。

完成上述条件后，进入用户本地部署安装验收阶段。
