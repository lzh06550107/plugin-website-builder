# Website Builder V1：旧 Section 显式迁移设计

## 1. 背景

Website Builder V1 的新页面结构已经收敛为：

```text
Page
└─ Container
   └─ Grid
      ├─ Heading
      ├─ Text
      ├─ Image
      └─ Button
```

早期 Draft 可能仍包含 `wb.section`，甚至存在：

```text
Page
└─ Section
   └─ Container
      ├─ Heading
      └─ Text
```

新版本不再在组件面板中创建 Section，但必须保证旧 Draft 可以打开、编辑和安全迁移。

## 2. 设计原则

旧 Schema 不做后台静默迁移。只有用户在编辑器中选中旧 Section，并点击“转换为新结构”后，才在当前编辑器内存中产生新的 Website Schema。

转换后仍然属于未保存 Draft。只有用户随后点击“保存草稿”，新结构才写入数据库；关闭编辑器可放弃转换结果。

## 3. 转换规则

选中的 `wb.section` 原节点 ID 保持不变，并转换成 `wb.container`，Section 自身的 `props / style / responsive` 尽量原样保留。

常见结构转换如下：

```text
Section
└─ Container
   ├─ Heading
   └─ Text
```

转换为：

```text
Container
└─ Grid (复用原 Container ID)
   ├─ Heading
   └─ Text
```

旧 Container 的样式和响应式配置随节点一起保留；如果原 Container 没有 Grid 列配置，迁移后默认使用 1 列，以尽量保持原先纵向内容顺序。

Section 直接包含内容组件时：

```text
Section
├─ Heading
└─ Button
```

转换为：

```text
Container
└─ Grid (自动生成，1 列)
   ├─ Heading
   └─ Button
```

Section 已经直接包含合法 Grid 时，Grid 保持不变并直接成为新 Container 的 child。

复杂旧结构中，如果存在 Container 包裹 Grid、Grid 中继续出现旧布局节点等情况，迁移命令会尽量展开为合法 Grid，并返回兼容调整 warning。编辑器必须提示用户迁移后检查布局，不允许静默丢弃整个旧 Section。

## 4. 编辑器交互

旧 Section 仍可渲染，但：

- 不再出现在左侧组件库；
- 空 Section 画布提示为“旧版 Section · 请在右侧转换为新结构”；
- 右侧属性面板显示“旧版 Section 兼容节点”；
- 提供“转换为新结构”按钮；
- 点击后先显示确认框；
- 转换成功后保持原 Section ID 为当前选中节点，但节点类型变为 Container；
- 如果迁移存在兼容调整，显示 warning；否则显示 success；
- 非 Page 节点仍可通过右侧“删除”或 Delete / Backspace 删除。

## 5. 数据安全

迁移命令只接收并返回 Website Schema：

```text
Current Draft Schema
      ↓
convertLegacySection()
      ↓
New Draft Schema in editor memory
```

它不调用 API、不写数据库、不创建发布版本。

真正持久化仍由现有：

```text
保存草稿
  ↓
websiteBuilder:saveDraft
```

完成。

## 6. 测试要求

自动测试至少覆盖：

- Section → Container → Content 转换成 Container → Grid → Content；
- 保留 Section 自身 style / responsive；
- 保留旧 Container style / responsive；
- 旧 Container 转成 Grid 后默认 1 列；
- Section 直接内容自动包装为 1 列 Grid；
- 已存在 Grid 不重复包装；
- 对非 Section 节点执行迁移必须拒绝且原文档引用保持不变；
- 编辑态 Section 提示必须引导“转换为新结构”，不能继续引导添加旧层级子组件。

## 7. 本地验收

使用包含旧 Section 的首页 Draft：

```text
Page
└─ Section
```

选中 Section 后应看到：

```text
旧版 Section 兼容节点
[转换为新结构]
[删除]
```

点击转换并确认后，图层树应变成：

```text
Page
└─ Container
   └─ Grid   # 如果旧 Section 中已有内容
```

此时页面显示“未保存”。刷新或关闭但不保存时数据库旧 Draft 不应自动改变；点击保存草稿后，再重新进入编辑器应读取新结构。
