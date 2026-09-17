# Website Builder V1：组件层级、拖拽排序与零代码排版交互设计

## 1. 目标

本阶段不进入 Draft / Publish 验收，优先补齐 Website Builder 的核心编辑体验，使后台真正具备可用的零代码网页排版能力。

本阶段目标：

- 明确组件树的合法层级关系，而不是只用 `acceptsChildren: boolean`。
- 左侧组件库既支持点击插入，也支持拖拽到 Canvas。
- Canvas 支持已有节点同父级排序、跨容器移动、拖入和拖出。
- 增加“组件 / 图层”双 Tab，图层树支持选中、排序、跨父级移动。
- Canvas 与图层树双向联动。
- 拖拽过程显示明确的合法 / 非法 Drop Indicator。
- 空 Section / Container / Grid 保持足够的编辑命中区域，但编辑器辅助样式不能进入正式页面 Schema。
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

Canvas、图层树、选中框、Drop Indicator 都只是编辑器视图，不把编辑器 UI 状态写入 Website Schema。

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

### 3.3 拖拽规则以 Registry 为准

不能在 Canvas 中散落大量 `if (type === ...)`。合法父子关系由 `ComponentRegistry` 定义，Canvas、图层树、点击插入共用同一套规则。

## 4. 组件层级规则

将现有：

```ts
acceptsChildren: boolean
```

升级为：

```ts
interface WebsiteComponentDefinition {
  type: string;
  label: string;
  category: 'layout' | 'content';
  acceptsChildren: boolean;
  allowedParentTypes?: string[];
  allowedChildTypes?: string[];
  canContain?: (childType: string) => boolean;
}
```

V1 初始规则：

```text
wb.page
  └─ 允许：wb.section

wb.section
  └─ 允许：wb.container / wb.grid / 内容组件

wb.container
  └─ 允许：wb.grid / 内容组件

wb.grid
  └─ 允许：wb.container / 内容组件

wb.heading
wb.text
wb.image
wb.button
  └─ 不允许 children
```

这里刻意不允许 `Section` 嵌套 `Section`，避免 V1 形成不必要的网页结构歧义。`Page → Section → Container/Grid/Content` 是推荐结构，`Container` 与 `Grid` 负责内部排版。

统一提供：

```ts
canInsertChild(parentType, childType): boolean
canMoveNode(document, nodeId, targetParentId): boolean
```

并必须阻止：Page 被移动、节点拖入自身、节点拖入自己的任意 descendant、违反 Registry 层级约束的移动。

## 5. 插入模型

### 5.1 点击左侧组件

点击插入仍保留，但规则调整为：

1. 当前选中节点可以容纳目标组件：插入选中节点末尾。
2. 当前选中节点不能容纳：向上寻找最近的合法 ancestor。
3. 找不到合法 ancestor：不插入，并提示原因。

例如当前选中 Heading 后点击 Text，Heading 不能有 children，因此应向上找到最近合法父节点，把 Text 插入为 Heading 的同级节点，而不是错误地塞进 Page 根节点。

### 5.2 左侧拖入 Canvas

拖拽组件库项时创建：

```ts
DragSource = {
  kind: 'palette';
  componentType: 'wb.text';
}
```

只有 drop 成功时才创建新的 WebsiteNode，drag hover 阶段不污染文档。

## 6. 已有节点拖拽模型

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
moveNode(document, nodeId, targetParentId, targetIndex)
```

支持同父级排序、跨父级移动、拖入空容器三类操作。

## 7. shared/tree 新能力

现有 `find / update / insert / remove` 保留，新增：

```ts
findNodeLocation(root, nodeId)
getParentNode(root, nodeId)
isDescendant(root, ancestorId, candidateId)
insertNodeAt(root, parentId, node, index)
extractNode(root, nodeId)
moveNode(root, nodeId, targetParentId, targetIndex)
reorderNode(root, parentId, fromIndex, toIndex)
```

`moveNode()` 必须保证：单次不可变更新、node id 不变化、原 subtree 完整保留、同父级向后移动时正确处理删除后 index 偏移。

V1 保持纯函数风格：合法性由 Editor Command 先校验，`shared/tree` 只负责确定性的树变换，不在底层树工具里混入 Component Registry 业务依赖。

## 8. Editor Command 层

`src/client/editor/commands/` 从单文件逐步拆分为：

```text
commands/
├─ insert.ts
├─ move.ts
├─ remove.ts
├─ update.ts
├─ validate.ts
└─ index.ts
```

核心 API：

```ts
insertComponent(document, registry, selection, componentType, target?)
moveEditorNode(document, registry, nodeId, targetParentId, targetIndex)
removeEditorNode(document, nodeId)
updateNodeProps(...)
updateNodeStyle(...)
```

Canvas 和 Layer Tree 禁止直接调用 `shared/tree.moveNode()`，统一经过 Editor Command，确保层级业务规则只有一个入口。

## 9. 编辑器布局调整

左侧改为两个 Tab：

```text
┌───────────────┐
│ 组件 | 图层   │
├───────────────┤
│  当前内容     │
└───────────────┘
```

组件 Tab 按“布局 / 内容”分组。每个组件既支持点击插入，也支持拖拽进入 Canvas。

图层 Tab 显示完整 Schema 树：

```text
Page
└─ Section
   ├─ Container
   │  ├─ Heading
   │  └─ Text
   └─ Button
```

图层行为：点击节点选中；Canvas 同步高亮；展开 / 折叠只属于 UI 状态；节点可排序或跨父级移动；Page 根节点显示但不可拖动、不可删除。

## 10. Canvas Drop Zone 设计

Canvas 采用 DOM-flow Builder，不做无限自由定位。每个可容器节点提供：before child 0、between child N/N+1、after last child，以及空容器的 inside target。

拖动时：合法目标显示蓝色 Indicator；非法目标显示禁止状态且不执行 drop；空容器整个空状态区域作为 inside target。

Drop Indicator 不得修改节点真实 border / margin。使用 Editor Chrome / Overlay 来显示 selection、hover 和 drop indicator；Preview 与 Published Renderer 不加载这些编辑器辅助层。

## 11. Canvas 与 Layer Tree 联动

Editor State 新增：

```ts
interface EditorState {
  document: WebsiteNode;
  selectedNodeId: string;
  hoveredNodeId?: string;
  dragging?: DragState;
  dropTarget?: DropTarget;
  device: DeviceType;
  dirty: boolean;
}
```

Canvas 点击后更新 `selectedNodeId`，图层树同步选中并展开 ancestor；图层树点击后更新同一个 `selectedNodeId`，Canvas 同步高亮。

V1 必须完成 selected 联动与树自动展开。Canvas `scrollIntoView` 作为增强项，不作为阻塞本阶段完成的核心 Gate。

## 12. 拖拽技术选择

本阶段优先使用浏览器原生 HTML5 Drag and Drop + React 事件封装，而不是立即增加 dnd-kit / react-dnd 依赖。

原因是当前 V1 组件数量少、拖拽模型仍在快速调整，同时要尽量避免插件新增运行时依赖导致 NocoBase 构建和版本冲突。

抽象出：

```text
editor/dnd/
├─ types.ts
├─ dragPayload.ts
├─ dropRules.ts
└─ index.ts
```

未来如果原生 DnD 在触摸端或复杂嵌套 hit test 上遇到瓶颈，只替换 DnD adapter，不改 Tree Command 与 Registry Contract。

## 13. 零代码排版交互范围

完成本阶段后，运营用户应能：添加 Section；拖入 Container；拖入 Heading / Text / Button；调整同级顺序；创建第二个 Section；把内容从一个容器拖到另一个容器；在图层树中重新排序；点击任意图层在右侧修改 props/style；切换 Desktop/Mobile 编辑响应式样式。

用户不需要理解 DOM、JSON、React、FlowModel。

## 14. 测试策略

### 14.1 纯树逻辑测试

覆盖：`insertNodeAt` 开头/中间/末尾、同父级向前排序、同父级向后排序、跨父级移动、subtree 保留。

### 14.2 Registry 层级测试

覆盖：Page 接受 Section；Page 拒绝 Text/Button；Section 接受 Container/Grid/内容；Container 接受 Grid/内容并拒绝 Section；Heading/Text/Image/Button 拒绝 children。

### 14.3 Editor Command 测试

覆盖：点击插入选中合法容器；当前为内容组件时向上寻找合法 parent；找不到目标时不修改文档；非法 move 不修改文档；自身/descendant/Page move 均被拒绝。

### 14.4 UI 人工验收

本地 NocoBase 中验证：组件 Tab 可点击/拖动；Layer Tree 正确反映 Schema；Canvas/Layers 双向选中；同级排序与跨容器移动实时反映；非法 drop 被阻止；空节点始终可命中；Preview 不出现编辑器占位文字、drop line 和 outline。

## 15. 实施顺序

```text
Feature 1：Tree move / reorder 纯逻辑
  ↓
Feature 2：Registry 父子约束
  ↓
Feature 3：Editor Command 合法插入 / 移动
  ↓
Feature 4：Layer Tree + 双向选中
  ↓
Feature 5：Canvas Drop Zones + Drop Indicator
  ↓
Feature 6：组件库拖入 Canvas
  ↓
Feature 7：Layer Tree 拖拽
  ↓
Feature 8：本地交互验收
```

每个 Feature 必须先有失败测试，再实现，再运行完整纯逻辑测试。

## 16. 完成标准

本阶段完成必须同时满足：Page/Section/Container/Grid/Content 层级规则稳定；点击插入不会把内容错误插到 Page 根节点；Canvas 支持已有节点同级和跨容器移动；组件库支持拖入 Canvas；图层树支持选中与拖拽移动；Canvas/Layers 双向同步；非法层级和循环移动被阻止；Preview/Published Renderer 不含编辑器辅助 DOM 样式；纯逻辑自动测试全部通过。

NocoBase 本地 build + 人工交互验收通过后，才进入 Draft / Publish Release Gate。
