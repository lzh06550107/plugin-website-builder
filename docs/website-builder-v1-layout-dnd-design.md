# Website Builder V1：组件层级、拖拽排序与零代码排版交互设计

## 1. 目标

本阶段不进入 Draft / Publish 验收，优先补齐 Website Builder 的核心编辑体验，使后台真正具备可用的零代码网页排版能力。

本阶段目标：

- 明确组件树的合法层级关系，而不是只用 `acceptsChildren: boolean`。
- 左侧组件库既支持点击插入，也支持拖拽到 Canvas。
- Canvas 支持已有节点同父级排序、跨合法容器移动、拖入和拖出。
- 增加“组件 / 图层”双 Tab，图层树支持选中、排序、跨父级移动。
- Canvas 与图层树双向联动。
- 拖拽过程显示明确的合法 / 非法 Drop Indicator。
- 空 Page / Container / Grid 保持足够的编辑命中区域，但编辑器辅助样式不能进入正式页面 Schema。
- 所有树变更统一走纯函数命令层，便于 TDD、Undo/Redo 和后续历史记录。

## 2. 不在本阶段处理的内容

本阶段不实现：Draft / Published 隔离验收、Undo / Redo 完整历史栈、复制 / 粘贴、多选节点、Grid 单元格可视化拉伸、绝对定位自由画布、自定义断点、动画时间轴和第三方组件市场。

这些能力需要建立在稳定的组件树和拖拽协议之上，后续迭代再增加。

## 3. 设计原则

### 3.1 Schema 是唯一业务真相

拖拽行为最终只能改变 `WebsiteNode` 树：

```text
WebsiteNode
├─ id
├─ type
├─ props
├─ style
├─ responsive
└─ children
```

Canvas、图层树、Drop Indicator、空节点提示都只是编辑器视图，不把编辑器 UI 状态写入 Website Schema。

### 3.2 树操作必须是纯函数

任何节点移动都不能让 React 组件直接修改 `children` 数组，而应统一经过：

```text
Editor UI
  ↓
Editor Command
  ↓
shared/tree
  ↓
new WebsiteNode tree
```

这样后续 Undo / Redo、协作编辑和 AI 修改页面时都能复用同一套命令。

### 3.3 拖拽和插入规则以 Registry 为准

不能在 Canvas、图层树和组件面板中分别写一套父子关系。合法父子关系由 `ComponentRegistry` 定义，Canvas、图层树、点击插入共用同一套规则。

## 4. V1 严格组件层级

V1 新建页面固定采用：

```text
Page
└─ Container
   └─ Grid
      ├─ Heading
      ├─ Text
      ├─ Image
      └─ Button
```

允许一个 Page 有多个 Container，一个 Container 有多个 Grid，一个 Grid 有多个内容组件。

Registry 规则：

```text
wb.page
  └─ 仅允许：wb.container

wb.container
  └─ 仅允许：wb.grid

wb.grid
  └─ 仅允许：wb.heading / wb.text / wb.image / wb.button

wb.heading
wb.text
wb.image
wb.button
  └─ 不允许 children
```

`wb.section` 仅为旧 Draft / Published Schema 的兼容渲染保留，新建组件面板不再显示 Section。旧 Section 暂时只允许继续放置 Container，后续提供 Schema migration 后再移除兼容逻辑。

统一由：

```ts
ComponentRegistry.canContain(parentType, childType)
```

判断父子合法性，并必须阻止：Page 被移动、节点拖入自身、节点拖入自己的任意 descendant、违反 Registry 层级约束的移动。

## 5. 点击插入模型

点击组件时采用“显式父级”规则，而不是无限向上寻找祖先：

```text
选中 Page       → 只能新增 Container
选中 Container  → 只能新增 Grid
选中 Grid       → 只能新增内容组件
选中内容组件     → 可以新增同级内容组件到其父 Grid
```

因此：

- 要新增另一个 Container，先选 Page。
- 要新增另一个 Grid，先选对应 Container。
- 要新增 Heading / Text / Image / Button，先选 Grid；选中已有内容组件时也可以快速新增同级内容。
- 布局节点如果不能直接容纳目标组件，不自动跳到远端祖先插入，避免“选中这里却插到别处”的不可预测行为。

组件面板必须根据当前 selection 禁用不能插入的组件。点击、拖拽和图层树移动最终仍以 Registry 规则为准。

## 6. 左侧拖入 Canvas

拖拽组件库项时创建：

```ts
DragSource = {
  kind: 'palette';
  componentType: 'wb.text';
}
```

只有 drop 成功时才创建新的 WebsiteNode，drag hover 阶段不污染文档。

## 7. 已有节点拖拽模型

已有节点拖拽数据：

```ts
DragSource = {
  kind: 'node';
  nodeId: string;
}
```

Drop Target：

```ts
DropTarget = {
  parentId: string;
  index: number;
  position: 'before' | 'inside' | 'after';
}
```

最终统一转换为：

```ts
moveEditorNode(document, registry, nodeId, targetParentId, targetIndex)
```

支持同父级排序、跨合法父级移动、拖入空容器三类操作。

## 8. shared/tree 能力

`shared/tree` 只提供无业务语义的不可变树操作：

```ts
findNode(root, nodeId)
findNodeLocation(root, nodeId)
getParentNode(root, nodeId)
getAncestorIds(root, nodeId)
isDescendant(root, ancestorId, candidateId)
insertNodeAt(root, parentId, node, index)
moveNode(root, nodeId, targetParentId, targetIndex)
reorderNode(root, parentId, fromIndex, toIndex)
removeNode(root, nodeId)
```

`moveNode()` 必须保证：单次不可变更新、node id 不变化、原 subtree 完整保留、同父级向后移动时正确处理删除后 index 偏移。

合法性由 Editor Command 先校验，`shared/tree` 不依赖 Component Registry。

## 9. Editor Command 层

`src/client/editor/commands/` 负责业务级插入和移动：

```text
commands/
├─ insert.ts
├─ move.ts
├─ validate.ts
└─ index.ts
```

核心 API：

```ts
findInsertionParent(...)
insertComponent(...)
validateMove(...)
moveEditorNode(...)
removeEditorNode(...)
updateNodeProps(...)
updateNodeStyle(...)
```

Canvas 和 Layer Tree 禁止直接修改 `children`，统一经过 Editor Command。

## 10. 编辑器布局

左侧：

```text
┌────────────────────┐
│ 组件 | 图层        │
├────────────────────┤
│ 结构约束提示       │
│ 布局组件           │
│ 内容组件           │
└────────────────────┘
```

新建组件面板只显示：

```text
布局：Container / Grid
内容：Heading / Text / Image / Button
```

不再显示 Section。

图层树示例：

```text
Page
├─ Container A
│  └─ Grid A
│     ├─ Heading
│     ├─ Text
│     └─ Button
└─ Container B
   └─ Grid B
```

图层行为：点击节点选中；Canvas 使用同一 `selectedNodeId`；展开 / 折叠只属于 UI 状态；节点可排序或跨合法父级移动；Page 根节点不可拖动、不可删除。

## 11. Canvas Drop Zone 与编辑器辅助样式

Canvas 采用 DOM-flow Builder，不做无限自由定位。每个节点根据 DOM 几何计算 before / inside / after target，最终归一为同一个 `parentId + index` 模型。

拖动时：

- 合法目标显示蓝色 Drop Indicator；
- 非法目标显示红色 / 禁止状态且不能执行 drop；
- 空 Page / Container / Grid 的虚线空状态区域可作为 inside target。

Drop Indicator 和虚线空状态都属于 Editor Chrome，不写入 Schema。

### 11.1 选中态不使用实体外框

不再给选中节点注入蓝色 `outline`，避免编辑器辅助线看起来像真实页面边框。Selection 主要通过：

- 左侧图层树选中状态；
- 右侧属性面板节点类型；
- 当前空容器自身的虚线 Drop 区；
- 拖拽时的 Drop Indicator；

表达。

Preview 与 Published Renderer 不显示虚线空状态、Drop Indicator 或任何拖拽属性。

## 12. 删除交互

除 Page 根节点外，所有组件均可删除。

删除入口：

- 属性面板顶部固定显示“删除”；
- 非输入状态下支持 Delete / Backspace 快捷键；
- 删除后自动选中被删除节点的父节点；
- Page 根节点始终不可删除。

删除仍经过 `removeEditorNode()`，不允许 UI 直接修改 children。

## 13. Canvas 与 Layer Tree 联动

Editor State 使用一个 `selectedNodeId` 作为选择态真相：

```ts
interface EditorState {
  document: WebsiteNode;
  selectedNodeId: string;
  dragging?: DragSource;
  dropTarget?: DropTarget;
  device: DeviceType;
  dirty: boolean;
}
```

Canvas 点击和图层树点击都更新同一个 selection；图层树在选中深层节点时自动展开 ancestor。

## 14. 拖拽技术选择

V1 使用浏览器原生 HTML5 Drag and Drop + React 事件封装，不立即增加 dnd-kit / react-dnd 运行时依赖。

抽象目录：

```text
editor/dnd/
├─ types.ts
├─ dragPayload.ts
├─ dropRules.ts
└─ index.ts
```

未来如果触摸端或复杂嵌套 hit test 需要升级，只替换 DnD adapter，不改 Tree Command 与 Registry Contract。

## 15. 零代码排版范围

完成本阶段后，运营用户应能：

```text
Page
→ 添加多个 Container
→ 每个 Container 添加一个或多个 Grid
→ Grid 中添加内容组件
→ Canvas / 图层树排序内容
→ 内容组件在不同 Grid 之间移动
→ Grid 在不同 Container 之间移动
→ Container 在 Page 内排序
→ 右侧调整 width / maxWidth / minHeight
→ Flex direction / justify / align / gap
→ Grid columns
→ 四边 Margin / Padding
→ 字体 / 颜色 / 背景 / 圆角
→ Desktop / Mobile 分别配置
```

用户不需要理解 DOM、JSON、React 或 FlowModel。

## 16. 测试策略

### 16.1 Registry 层级测试

必须覆盖：

- Page 仅接受 Container；
- Container 仅接受 Grid；
- Grid 仅接受四类内容组件；
- 内容组件拒绝 children；
- Section 只做兼容，不允许新结构继续扩散。

### 16.2 Editor Command 测试

必须覆盖：

- Page + Container 合法；
- Container + Grid 合法；
- Grid + 内容合法；
- 内容节点新增同级内容合法；
- 布局节点不向远端 ancestor 自动插入；
- 非法 move 不修改文档；
- 自身 / descendant / Page move 均被拒绝。

### 16.3 UI 人工验收

本地 NocoBase 中验证：

- 空 Page 只允许 Container；
- 空 Container 只允许 Grid；
- 空 Grid 只允许内容组件；
- 不合法组件按钮 disabled；
- Canvas 和 Layer Tree 的非法 drop 都被禁止；
- 删除按钮始终可见且 Delete / Backspace 有效；
- 选中节点没有蓝色实体外框；
- Preview 不出现虚线空状态、drop indicator、drag 属性和其他 editor chrome。

## 17. 完成标准

本阶段完成必须同时满足：

```text
Page → Container → Grid → Content
```

层级规则稳定；点击和拖拽都不能产生非法树；组件面板能提前禁用非法选择；Canvas 和 Layer Tree 共用同一套 Registry / Command；组件可删除；选中态不污染页面视觉；Preview / Published Renderer 无编辑器辅助样式；本地 `yarn build @lzh/plugin-website-builder` 和人工交互验收通过。

只有 Gate A 通过后，才进入 Draft / Publish Release Gate。
