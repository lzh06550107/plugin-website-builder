# Website Asset Library 设计

## 1. 目标

为 Website Builder 的 `wb.image` 提供可复用的媒体资产能力，使编辑者在 Canvas 中双击 Image 后能够：

1. 从 Website Builder 媒体库选择已有图片；
2. 上传新图片并立即选择；
3. 继续保留手工图片 URL 作为兼容/高级入口；
4. 编辑 Alt；
5. 只把最终 `src / alt` 写入 Website Schema，媒体库本身不进入页面 Schema。

本设计不把 NocoBase 的 `attachments` 当成全局媒体库，也不开放 `attachments:list`。

## 2. 已确认的 NocoBase 约束

NocoBase 文件管理器有两个重要行为：

- `attachments` 是底层附件资源，普通客户端不能把它当成可浏览全局媒体库；文件管理器服务端显式覆盖了 `attachments:list` 并返回 404。
- `template: 'file'` 的独立文件表是合法的文件集合，可以使用文件管理器的上传、永久文件 URL、存储引擎和标准文件字段。

因此 Website Builder 使用专用文件集合 `wbAssets`，而不是绕过 `attachments` 的访问设计。

## 3. 总体架构

```text
WebsiteEditor
│
├─ Website Schema
│    └─ wb.image
│         └─ props
│              ├─ src
│              └─ alt
│
├─ WebsiteAssetPicker (Editor Chrome)
│    ├─ 媒体库
│    ├─ 上传图片
│    └─ 图片 URL
│
└─ NocoBase
     ├─ wbAssets        ← template: file
     ├─ File Manager    ← 上传/存储/永久 URL
     └─ ACL             ← 管理端 list/get/create；不公开 list
```

公开网页 Renderer 只消费 `wb.image.props.src`，不会在运行时调用 `wbAssets:list`。

## 4. `wbAssets` Collection

新增：

```text
src/server/collections/wbAssets.ts
```

定义为 NocoBase file collection：

```ts
export default defineCollection({
  name: 'wbAssets',
  title: 'Website Builder Assets',
  template: 'file',
});
```

标准 file template 负责文件记录需要的字段，包括：

```text
id
createdAt / updatedAt
title
filename
extname
size
mimetype
storageId
path
meta
url
preview（运行时补充）
```

V1 不额外增加 `siteId`。媒体资产在整个 Website Builder 中共享，以减少重复上传并保持实现简单。

## 5. 公共图片访问与后台列表权限分离

### 5.1 后台媒体库

后台编辑器通过 `wbAssets:list` / `wbAssets:get` 浏览资产，通过 `wbAssets:create` 上传。

这些操作只能授予 Website Builder 管理权限：

```text
pm.website-builder.view
  wbAssets:list
  wbAssets:get

pm.website-builder.edit
  wbAssets:create
```

V1 不把 `wbAssets:destroy` 暴露到媒体选择器，也不提供删除 UI。

### 5.2 Published 图片访问

Website Builder 资产本质上是公开网页资源。Published 页面需要在未登录状态访问永久文件 URL，但不能因此开放资产列表。

使用 NocoBase File Manager 的 `registerFileAccessAuthorizer()` 注册 Website Builder 专用 authorizer：

```text
collectionName === 'wbAssets'
dataSourceKey === 'main'
→ 允许文件内容访问
```

结果：

```text
/files/.../wbAssets/<id>.<ext>
```

可以作为公开页面图片 URL 使用，而：

```text
/api/wbAssets:list
```

仍受后台 ACL 控制，不对 public 开放。

如果运行时没有 File Manager 插件，Website Builder 不尝试实现自己的文件存储；媒体库/上传入口应显示不可用提示，但“图片 URL”入口仍可工作。

## 6. 图片选择器 UI

双击 `wb.image` 打开统一的 `WebsiteAssetPicker`：

```text
┌────────────── 替换图片 ──────────────┐
│ [媒体库] [上传图片] [图片 URL]        │
│                                      │
│ 媒体库                               │
│ 搜索 [____________________]           │
│                                      │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│ │图1 │ │图2 │ │图3 │ │图4 │        │
│ └────┘ └────┘ └────┘ └────┘        │
│                                      │
│             < 1 2 3 >                │
│                                      │
│ Alt [________________________]        │
│                                      │
│                    [取消] [应用]      │
└──────────────────────────────────────┘
```

### 媒体库 Tab

- 只展示图片类型：`mimetype` 必须匹配 `image/*`；
- 默认按创建时间倒序；
- 分页加载，不一次拉取全部资产；
- 搜索 title/filename；
- 点击卡片只改变当前 Picker 的临时 selection；
- 点击“应用”后才修改 Website Schema；
- 点击“取消”不改变 Schema。

### 上传图片 Tab

- 复用 NocoBase File Manager 上传能力；
- 上传目标为 `wbAssets:create`；
- 单文件上传；
- 限制 `accept="image/*"`；
- 上传成功后将返回文件记录作为当前 selection；
- 不自己实现 multipart / S3 / OSS / COS 协议。

### 图片 URL Tab

保留现有功能：

```text
图片 URL
Alt
预览
```

用于外部 CDN、已有公开 URL 或 File Manager 不可用时的降级。

## 7. 客户端边界

新增独立模块，避免把文件 API 直接塞入 `WebsiteEditor.tsx`：

```text
src/client/editor/assets/
├─ types.ts
├─ assetApi.ts
├─ WebsiteAssetPicker.tsx
└─ index.ts
```

### `types.ts`

核心类型：

```ts
export interface WebsiteAsset {
  id: string | number;
  title?: string;
  filename?: string;
  mimetype?: string;
  url: string;
  preview?: string;
  size?: number;
  meta?: Record<string, unknown>;
}
```

### `assetApi.ts`

只负责把 NocoBase API 返回值规范化为 `WebsiteAsset`：

```ts
listWebsiteAssets(api, options)
normalizeWebsiteAsset(record)
```

UI 不直接依赖后端响应的杂项字段。

### `WebsiteAssetPicker.tsx`

负责：

- Tab 状态；
- 搜索词；
- 分页；
- 临时选中项；
- 上传结果；
- URL 输入；
- Alt；
- 应用/取消。

它是 Editor Chrome，不允许写入 Website Schema。

真正写入 Schema 仍统一走已有：

```ts
updateInlineImage(document, nodeId, { src, alt })
```

## 8. 与 Image 双击编辑的集成

现有流程：

```text
Image double-click
→ onInlineImageEditRequest(nodeId)
→ WebsiteEditor 打开替换图片 Modal
```

改为：

```text
Image double-click
→ onInlineImageEditRequest(nodeId)
→ WebsiteEditor 打开 WebsiteAssetPicker
→ Picker onApply({ src, alt })
→ updateInlineImage()
→ replaceDocument()
→ dirty = true
→ selectedNodeId 保持 Image
```

不改变 `wb.image` Schema 格式。

## 9. 数据持久化原则

媒体库与页面 Schema 解耦。

页面只保存：

```json
{
  "type": "wb.image",
  "props": {
    "src": "/files/main/main/wbAssets/123.png",
    "alt": "产品图片"
  }
}
```

不保存：

```text
assetId
storageId
完整 wbAssets record
上传组件状态
媒体库分页状态
```

理由：Published Renderer 应该保持静态、轻量，不依赖后台资产查询。

## 10. 删除策略

V1 媒体选择器不允许删除资产。

原因：

```text
同一 wbAssets 图片
  ├─ Page A 引用
  ├─ Page B 引用
  └─ Published Version C 引用
```

如果直接删除文件，历史 Published 版本和其他页面可能立即出现坏图。

后续若增加资产删除，需要先实现引用检查或引用计数，再决定“禁止删除 / 替换引用 / 强制删除”。

## 11. 错误处理

需要明确处理：

- `wbAssets:list` 请求失败：媒体库显示错误态并允许重试；
- 上传失败：保留当前图片，不关闭 Picker；
- 返回记录没有 `url`：不允许应用；
- 非图片 mimetype：媒体库过滤，上传前通过 `accept=image/*` 限制；
- Image 节点在 Picker 打开期间被删除：应用时 `updateInlineImage()` 安全失败并提示；
- File Manager 不可用：禁用“媒体库/上传图片”，保留“图片 URL”。

## 12. 安全边界

- 不开放 `attachments:list`；
- 不开放 public `wbAssets:list`；
- 不把 Draft Schema API 公开；
- public 只得到图片文件访问能力，不得到媒体库枚举能力；
- Picker 不支持任意 Collection 名称，固定使用 `wbAssets`；
- Published 页面不携带管理 API token，也不调用媒体管理接口。

## 13. TDD / 验收顺序

### Gate 1：Collection / ACL

- `wbAssets` 是 `template: file`；
- View snippet 包含 list/get；
- Edit snippet 包含 create；
- public 不包含 list/get/create；
- File access authorizer 只允许 `main + wbAssets`。

### Gate 2：Asset API

- 正确规范化文件记录；
- 只返回 image/*；
- 支持分页/搜索参数；
- 无 URL 记录不能成为可选资产。

### Gate 3：Picker

- 媒体库分页/搜索；
- 上传成功自动选中；
- URL fallback；
- Cancel 不提交；
- Apply 只提交 `{src, alt}`。

### Gate 4：Image 集成

- 双击 Image 打开 Picker；
- 选择已有图片后 `props.src` 更新；
- Alt 更新；
- style/responsive/其他 props 保留；
- Draft 标记 dirty；
- Preview/Published 不出现 Picker。

### Gate 5：真实 NocoBase

本地必须通过：

```bash
yarn build @lzh/plugin-website-builder
yarn dev-server
```

浏览器人工验收：

```text
上传图片 → 出现在媒体库 → 选择 → 应用 → 保存草稿 → Preview → Publish
```

并用未登录窗口验证 Published 图片 URL 可访问，而 `wbAssets:list` 不应成为 public API。

## 14. V1 明确不做

- 文件夹/目录树；
- 标签系统；
- 图片裁剪；
- 图片压缩/WebP 自动转换；
- 批量上传；
- Asset 删除；
- 按 site 隔离；
- Published Runtime 动态查询资产；
- 绕过 NocoBase File Manager 自己维护对象存储协议。
