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

本阶段不实现：

- Draft / Published 隔离验收。
- Undo / Redo 完整历史栈。
- 复制 / 粘贴。
- 多选节点。
- Grid 单元格可视化拉伸。
- 绝对定位自由画布。
- 自定义断点。
- 动画时间轴。
- 第三方组件市场。

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

任何节点移动都不能让 React 组件直接修改 `children` 数组。

统一通过：

```text
Editor UI
  ↓
Editor Command
  ↓
shared/tree
  ↓
new WebsiteNode tree
```

这样后续 Undo / Redo、协作编辑、AI 修改页面时都能复用同一套命令。

### 3.3 拖拽规则以 Registry 为准

不能在 Canvas 中写大量：

```ts
if (type === 'wb.section') ...
```

合法父子关系由 `ComponentRegistry` 定义，Canvas、图层树、点击插入共用同一套规则。

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
  └─ 允许：wb.section / wb.container / wb.grid / 内容组件

wb.grid
  └─ 允许：wb.container / 内容组件

wb.heading
wb.text
wb.image
wb.button
  └─ 不允许 children
```

其中 `Page → Section` 作为推荐网页结构约束。内容组件不能成为任何节点的父节点。

校验统一提供：

```ts
canInsertChild(parentType, childType): boolean
canMoveNode(document, nodeId, targetParentId): boolean
```

还必须阻止：

- Page 被移动。
- 节点拖入自身。
- 节点拖入自己的任意 descendant。
- 违反 Registry 层级约束的移动。

## 5. 插入模型

### 5.1 点击左侧组件

点击插入仍保留，但规则调整为：

1. 当前选中节点可以容纳目标组件：插入选中节点末尾。
2. 当前选中节点不能容纳：向上寻找最近的合法 ancestor。
3. 找不到合法 ancestor：不插入，并提示原因。

示例：

```text
当前选中 Heading
点击 Text
```

Heading 不能有 children，因此向上寻找 Container，最终插入为 Heading 的同级节点，而不是错误地塞进 Page 根节点。

### 5.2 左侧拖入 Canvas

拖拽组件库项时创建的是：

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

底层统一转换为：

```ts
moveNode(document, nodeId, targetParentId, targetIndex)
```

支持三类操作：

```text
A. 同父级排序
Section
├─ Heading
├─ Text      ← 拖到 Heading 前
└─ Button

B. 跨父级移动
Section A              Section B
└─ Container           └─ Container
   └─ Button  ───────────→  Button

C. 拖入空容器
Section
└─ Container [空]
       ↑
     Image
```

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

`moveNode()` 必须保证：

- 单次不可变更新。
- node id 不变化。
- 原节点 subtree 完整保留。
- 同父级向后移动时正确处理删除后 index 偏移。
- 非法移动返回原 document 或明确的 command result，不产生半完成状态。

推荐返回：

```ts
interface TreeCommandResult {
  document: WebsiteNode;
  changed: boolean;
  reason?: string;
}
```

V1 可以先保持现有函数返回 document，同时另外提供 validate 函数；如果实现中发现错误反馈需要统一，再升级为 Result 类型。

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
│               │
│  当前 Tab     │
│               │
└───────────────┘
```

### 9.1 组件 Tab

组件按类别显示：

```text
布局
  Section
  Container
  Grid

内容
  Heading
  Text
  Image
  Button
```

每项：

- 点击：按插入模型插入。
- 拖拽：进入 Canvas Drop System。

### 9.2 图层 Tab

显示完整树：

```text
Page
└─ Section
   ├─ Container
   │  ├─ Heading
   │  └─ Text
   └─ Button
```

行为：

- 点击节点：选中。
- 选中变化：Canvas 同步高亮。
- 展开 / 折叠：仅属于 UI 状态，不写入 Schema。
- 拖拽节点：排序或跨父级移动。
- Page 根节点显示但不可拖动 / 删除。

## 10. Canvas Drop Zone 设计

Canvas 不做无限自由定位，而是 DOM-flow Builder。

每个可容器节点提供以下 drop zone：

```text
before child 0
inside empty container
between child N / N+1
after last child
```

例如：

```text
Section
  ───────────────  ← index 0
  Heading
  ───────────────  ← index 1
  Text
  ───────────────  ← index 2
```

拖动时：

- 合法目标：蓝色 Indicator。
- 非法目标：红色 / 禁止鼠标状态，不执行 drop。
- 空容器：整个空状态区域就是 inside target。

### 10.1 Drop Indicator 不进入网页输出

不能修改节点的真实 border / margin 来显示 drop line。

使用 Editor Overlay / wrapper：

```text
Node DOM
+ Editor Chrome
  ├─ selection outline
  ├─ hover outline
  └─ drop indicator
```

预览和 Published Renderer 不加载 Editor Chrome。

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

联动规则：

```text
Canvas click
  → selectedNodeId
  → Layer Tree 选中并自动展开 ancestor

Layer Tree click
  → selectedNodeId
  → Canvas 高亮
  → 尽量 scrollIntoView
```

V1 先实现 selected 联动；自动 scrollIntoView 如果需要复杂 DOM ref 管理，可作为本阶段尾项，但树自动展开必须实现。

## 12. 拖拽技术选择

本阶段优先使用浏览器原生 HTML5 Drag and Drop + React 事件封装，而不是立即增加 dnd-kit / react-dnd 依赖。

原因：

- 当前 V1 组件数量少。
- 拖拽模型仍在快速调整。
- 原生 DnD 足够验证树协议和交互模型。
- 避免插件新增运行时依赖导致 NocoBase 构建和版本冲突。

抽象出：

```text
editor/dnd/
├─ types.ts
├─ dragPayload.ts
├─ dropRules.ts
└─ index.ts
```

未来如果原生 DnD 在触摸端、复杂嵌套 hit test 上遇到瓶颈，只替换 DnD adapter，不改 Tree Command 与 Registry Contract。

## 13. 零代码排版交互范围

完成本阶段后，运营用户应该能完成：

```text
1. 添加 Section
2. 拖入 Container
3. 拖入 Heading / Text / Button
4. 把 Text 拖到 Heading 前后
5. 新建第二个 Section
6. 把 Button 从 Section 1 拖到 Section 2
7. 在图层树中再次重新排序
8. 点击任意图层，在右侧修改 props / style
9. Desktop / Mobile 切换继续编辑响应式样式
```

用户不需要理解 DOM、JSON、React、FlowModel。

## 14. 测试策略

### 14.1 纯树逻辑测试

必须覆盖：

- `insertNodeAt` 开头 / 中间 / 末尾。
- 同父级向前排序。
- 同父级向后排序。
- 跨父级移动。
- subtree 保留。
- 拖入自身拒绝。
- 拖入 descendant 拒绝。
- Page 不允许移动。

### 14.2 Registry 层级测试

覆盖：

- Page 接受 Section。
- Page 拒绝 Text / Button。
- Section 接受 Container / Grid / 内容。
- Heading / Text / Image / Button 拒绝 children。

### 14.3 Editor Command 测试

覆盖：

- 点击插入选中合法容器。
- 当前为内容组件时向上寻找合法 parent。
- 找不到目标时不修改文档。
- 非法 move 不修改文档。

### 14.4 UI 人工验收

本地 NocoBase 中验证：

- 组件 Tab 可点击 / 拖动。
- Layer Tree 能正确反映 Schema。
- Canvas / Layers 双向选中。
- 同级排序实时反映。
- 跨容器移动实时反映。
- 非法 drop 被阻止。
- 空节点始终可命中。
- Preview 不出现编辑器占位文字 / drop line / outline。

## 15. 实施顺序

按 Feature Gate 推进：

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

本阶段完成必须同时满足：

- Page / Section / Container / Grid / Content 层级规则稳定。
- 点击插入不会把内容错误插到 Page 根节点。
- Canvas 支持已有节点同级和跨容器移动。
- 组件库支持拖入 Canvas。
- 图层树支持选中与拖拽移动。
- Canvas / Layers 双向同步。
- 非法层级和循环移动被阻止。
- Preview / Published Renderer 不含编辑器辅助 DOM 样式。
- 纯逻辑自动测试全部通过。
- NocoBase 本地 build + 人工交互验收通过后，才进入 Draft / Publish Release Gate。
