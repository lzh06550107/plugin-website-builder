# Website Builder V1 组件选择与回溯编辑设计

## 1. 问题

网页组件存在严格父子层级后，子组件可能完全覆盖父级 Container/Grid 的可点击区域。如果只依赖 Canvas 单击，用户在后续编辑时很难重新选中父级布局节点。

V1 不重新引入实体蓝色选中框，而采用 Canvas、面包屑和图层树三路联动，并把右键菜单作为 Canvas 的主要快捷操作入口。

## 2. 选择入口

### Canvas

- 单击页面内容时选择鼠标命中的最内层组件。
- Hover 非 Page 节点时显示轻量淡蓝虚线和组件名称。
- 右键组件时先精确选中该组件，再打开组件快捷菜单。
- Hover 虚线和右键菜单都属于 Editor Chrome，不进入 Website Schema，也不出现在 Preview/Published。

### 选择面包屑

Canvas 顶部固定显示当前节点路径，例如：

```text
Page › Container › Grid › Heading · 首页标题
```

点击任意一级立即选中对应节点，并同步右侧属性面板和左侧图层树。

这解决了“子组件占满父容器后无法点击父级”的问题。

### 图层树

左侧“图层”Tab 保留完整组件树：

```text
Page
└─ Container
   └─ Grid
      ├─ Heading
      ├─ Text
      └─ Button
```

图层树用于精确选择任意节点。选择深层节点时自动展开祖先；Canvas 同步滚动到对应元素。

## 3. 选中状态表达

- 不绘制整块实体蓝色 selection outline。
- 当前节点由顶部面包屑的激活按钮、左侧图层树选中行和右侧属性标题共同表达。
- Canvas Hover 只使用 1px 淡蓝虚线，不持久化。
- 拖拽中的 Drop Indicator 仍优先于 Hover Outline。

## 4. Canvas 右键菜单

当前右键菜单提供：

```text
复制组件
上移
下移
────────
复制样式
粘贴样式
────────
删除组件
```

行为约束：

- 复制组件：复制当前节点及完整 subtree，所有副本节点重新生成唯一 ID，并插入到原节点后面；原节点不被修改。
- 上移/下移：只在同一父节点的 siblings 中调整顺序，不改变父子层级；位于首位时“上移”禁用，位于末位时“下移”禁用。
- 删除组件：按右键命中的 nodeId 精确删除，避免 selection 异步更新导致误删前一个组件。
- Page 根节点不能复制、移动或删除，对应菜单项禁用。
- 任何菜单操作完成后，编辑器继续保持一个明确 selection：复制后选中新副本，排序后仍选中原节点，删除后选中父节点。

## 5. 样式剪贴板

样式剪贴板只存在于当前 WebsiteEditor 会话中，不写入 Website Schema，也不进入 Draft/Published 数据。

复制样式只复制：

```text
style
responsive.desktop
responsive.mobile
```

不会复制：

```text
id
type
props
children
```

因此一个 Button 的文字和 href 不会因为粘贴样式而被覆盖。粘贴样式会完整替换目标节点当前的基础样式和 Desktop/Mobile 响应式样式，但目标节点的身份、内容和层级保持不变。

右键“复制样式”后，编辑器保存一个深拷贝的样式快照；在尚未复制任何样式之前，“粘贴样式”保持禁用。样式剪贴板允许跨组件类型粘贴，因为 Website Style DSL 是统一结构；如果某些样式对目标组件没有视觉意义，仍只属于样式层，不会破坏组件 Schema。

## 6. 删除

非 Page 节点支持多个删除入口：

- Canvas 右键“删除组件”；
- Canvas 面包屑右侧“删除当前组件”；
- 右侧属性面板“删除”；
- 键盘 Delete / Backspace（输入框编辑时不触发）。

这些入口最终走同一个 nodeId 定向删除命令，删除后自动选择父节点。

## 7. 自动定位

从图层树或面包屑选择节点后，Canvas 根据节点的 `data-wb-node-id` 查找真实渲染元素并执行 `scrollIntoView({ block: 'nearest', inline: 'nearest' })`。

自动定位只影响编辑器滚动位置，不修改 Schema。

## 8. 验收

```text
Page
└─ Container
   └─ Grid
      ├─ Heading
      ├─ Text
      └─ Button A
      └─ Button B
```

验收步骤：

1. 点击 Heading，右侧显示 Heading 属性。
2. 点击面包屑 Grid，右侧切换为 Grid 属性。
3. 点击面包屑 Container，右侧切换为 Container 属性。
4. 在“图层”中点击 Heading，Canvas 自动定位到 Heading。
5. 鼠标 Hover Heading/Grid 时仅出现淡蓝虚线，不出现实体 selection outline。
6. 右键 Text 后选择“上移”，Text 与 Heading 的顺序交换，Text 仍保持选中。
7. 再右键 Text 选择“下移”，顺序恢复。
8. 右键 Grid 选择“复制组件”，Container 下出现一个完整 Grid 副本，副本 subtree 使用新 ID。
9. 当前选中 Text 时直接右键 Button A 删除，只删除 Button A，不能误删 Text。
10. 为 Button A 设置颜色、圆角、Padding 和 Desktop/Mobile 宽度，右键 Button A 选择“复制样式”。
11. 右键 Button B 选择“粘贴样式”，Button B 的文字和 href 保持原值，但基础样式和 Desktop/Mobile 样式与 Button A 一致。
12. 未执行“复制样式”前，“粘贴样式”必须为禁用状态。
13. 右键 Page 时复制组件/上移/下移/删除不可执行；复制样式和已存在剪贴板时的粘贴样式仍可使用。
14. Preview 中不出现面包屑、Hover Outline、Context Menu、Drop Indicator 或其他 Editor Chrome。
