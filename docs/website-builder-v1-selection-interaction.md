# Website Builder V1 组件选择与回溯编辑设计

## 1. 问题

网页组件存在严格父子层级后，子组件可能完全覆盖父级 Container/Grid 的可点击区域。如果只依赖 Canvas 单击，用户在后续编辑时很难重新选中父级布局节点。

V1 不重新引入实体蓝色选中框，而采用 Canvas、面包屑和图层树三路联动，并把快捷工具条和右键菜单作为 Canvas 的主要操作入口。

## 2. 选择入口

### Canvas

- 单击页面内容时选择鼠标命中的最内层组件。
- Hover 非 Page 节点时显示轻量淡蓝虚线和组件名称。
- 右键组件时先精确选中该组件，再打开组件快捷菜单。
- Hover 虚线、快捷工具条和右键菜单都属于 Editor Chrome，不进入 Website Schema，也不出现在 Preview/Published。

### 选择面包屑

Canvas 顶部固定显示当前节点路径，例如：

```text
Page › Container › Grid › Heading · 首页标题
```

点击任意一级立即选中对应节点，并同步右侧属性面板和左侧图层树。

### 图层树

左侧“图层”Tab 保留完整组件树，用于精确选择任意节点。选择深层节点时自动展开祖先；Canvas 同步滚动到对应元素。

## 3. 选中状态表达

- 不绘制整块实体蓝色 selection outline。
- 当前节点由组件附近的快捷工具条、顶部面包屑、左侧图层树选中行和右侧属性标题共同表达。
- Canvas Hover 只使用 1px 淡蓝虚线，不持久化。
- 拖拽中的 Drop Indicator 仍优先于 Hover Outline 和快捷工具条。

## 4. 选中组件快捷工具条

选中任意非 Page 组件后，在对应组件附近显示：

```text
拖动 | 复制 | 删除 | 更多
```

定位规则：

- 优先显示在选中组件上方；
- 顶部空间不足时自动显示到组件下方；
- 靠近画布右边缘时自动向左收，工具条不能溢出 Canvas；
- 组件尺寸或 Canvas 尺寸变化时重新计算位置；
- Page 根节点不显示组件快捷工具条。

行为：

- 拖动：复用现有 node DragSource 和 DropTarget 规则，仍受 `Page → Container → Grid → Content` 层级约束；
- 复制：复用 `duplicateEditorNode()`，复制完整 subtree，并为副本生成新 ID；
- 删除：复用 nodeId 定向删除命令；
- 更多：打开与右键完全相同的 Context Menu，不维护第二套操作逻辑。

## 5. Canvas 右键菜单

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

- 复制组件：复制当前节点及完整 subtree，所有副本节点重新生成唯一 ID，并插入到原节点后面；
- 上移/下移：只在同一父节点的 siblings 中调整顺序，不改变父子层级；
- 删除组件：按右键命中的 nodeId 精确删除；
- Page 根节点不能复制、移动或删除；
- 复制后选中新副本，排序后仍选中原节点，删除后选中父节点。

## 6. 样式剪贴板

样式剪贴板只存在于当前 WebsiteEditor 会话中，不写入 Website Schema，也不进入 Draft/Published 数据。

复制样式只复制：

```text
style
responsive.desktop
responsive.mobile
```

不会复制 `id / type / props / children`。因此一个 Button 的文字和 href 不会因为粘贴样式而被覆盖。未复制任何样式之前，“粘贴样式”保持禁用。

## 7. 删除

非 Page 节点支持多个删除入口：

- 组件快捷工具条“删除”；
- Canvas 右键“删除组件”；
- Canvas 面包屑右侧“删除当前组件”；
- 右侧属性面板“删除”；
- 键盘 Delete / Backspace（输入框编辑时不触发）。

这些入口最终走同一个 nodeId 定向删除命令，删除后自动选择父节点。

## 8. 自动定位

从图层树或面包屑选择节点后，Canvas 根据节点的 `data-wb-node-id` 查找真实渲染元素并执行 `scrollIntoView({ block: 'nearest', inline: 'nearest' })`。

自动定位只影响编辑器滚动位置，不修改 Schema。

## 9. 验收

```text
Page
└─ Container
   └─ Grid
      ├─ Heading
      ├─ Text
      ├─ Button A
      └─ Button B
```

验收重点：

1. 点击 Heading 后，Heading 附近出现“拖动 / 复制 / 删除 / 更多”工具条。
2. 工具条不能出现整块实体 selection outline。
3. 选中靠近 Canvas 顶部的组件时，工具条自动显示在组件下方。
4. 选中靠近右边缘的组件时，工具条不能溢出 Canvas。
5. 点击“复制”后生成完整副本并选中新副本。
6. 点击“删除”后只删除当前组件并选中父节点。
7. 从“拖动”按钮拖组件时仍受合法父子层级约束。
8. 点击“更多”打开与右键相同的菜单。
9. 右键菜单中的上移/下移、复制样式/粘贴样式继续正常工作。
10. Preview 中不出现面包屑、Hover Outline、快捷工具条、Context Menu、Drop Indicator 或其他 Editor Chrome。
