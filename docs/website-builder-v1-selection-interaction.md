# Website Builder V1 组件选择与回溯编辑设计

## 1. 问题

网页组件存在严格父子层级后，子组件可能完全覆盖父级 Container/Grid 的可点击区域。如果只依赖 Canvas 单击，用户在后续编辑时很难重新选中父级布局节点。

V1 不重新引入实体蓝色选中框，而采用 Canvas、面包屑和图层树三路联动，并把快捷工具条、右键菜单和双击直接编辑作为 Canvas 的主要操作入口。

## 2. 选择入口

### Canvas

- 单击页面内容时选择鼠标命中的最内层组件。
- Hover 非 Page 节点时显示轻量淡蓝虚线和组件名称。
- 右键组件时先精确选中该组件，再打开组件快捷菜单。
- 双击 Heading / Text / Button 时直接进入文字编辑状态。
- 双击 Image 时打开“替换图片”对话框。
- Hover 虚线、快捷工具条、右键菜单和直接编辑控件都属于 Editor Chrome，不进入 Website Schema，也不出现在 Preview/Published。

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

## 7. 双击文字编辑

V1 支持：

```text
wb.heading
wb.text
wb.button
```

双击 Heading / Text / Button 后，原组件位置直接切换成输入控件，输入控件继承当前字体、颜色、行高和对齐方式，并临时关闭该节点的 draggable，避免文字编辑和拖拽冲突。

提交规则：

- Heading：`Enter` 提交；
- Button：`Enter` 提交；
- Text：普通 `Enter` 换行，`Ctrl+Enter` / `Cmd+Enter` 提交；
- Heading / Text / Button：失焦提交；
- Heading / Text / Button：`Esc` 取消并恢复原文字。

提交只更新目标节点的 `props.text`，必须保留 `id / type / style / responsive / children` 以及 Heading 的 `level`、Button 的 `href` 等其他 props。

文字更新统一通过 Editor Command `updateInlineText()`。编辑器通过轻量 `WebsiteEditorInteractionsProvider` 向编辑态组件提供提交回调；Preview/Published 不提供该 Context，因此不会进入可编辑状态。

## 8. 双击图片替换

双击 `wb.image` 后打开“替换图片”对话框，当前 V1 复用已经存在的图片属性能力：

```text
图片 URL
Alt
```

点击“应用”后统一通过 Editor Command `updateInlineImage()` 更新目标 Image 的 `props.src / props.alt`，并保留节点的其他 props、style、responsive、id 和层级。

当前这一小步**没有新增文件上传或媒体库子系统**。也就是说，双击图片的快速替换面板目前与右侧属性面板一样使用 URL；后续如果接入 NocoBase File Manager / 媒体库，只需要把 URL 输入控件替换成统一资源选择器，不需要修改 Website Schema。

Preview/Published 不提供 `onInlineImageEditRequest`，所以双击图片不会打开编辑对话框。

## 9. 删除

非 Page 节点支持多个删除入口：

- 组件快捷工具条“删除”；
- Canvas 右键“删除组件”；
- Canvas 面包屑右侧“删除当前组件”；
- 右侧属性面板“删除”；
- 键盘 Delete / Backspace（输入框编辑时不触发）。

这些入口最终走同一个 nodeId 定向删除命令，删除后自动选择父节点。

## 10. 自动定位

从图层树或面包屑选择节点后，Canvas 根据节点的 `data-wb-node-id` 查找真实渲染元素并执行 `scrollIntoView({ block: 'nearest', inline: 'nearest' })`。

自动定位只影响编辑器滚动位置，不修改 Schema。

## 11. 验收

```text
Page
└─ Container
   └─ Grid
      ├─ Heading
      ├─ Text
      ├─ Image
      └─ Button
```

验收重点：

1. 点击 Heading 后，Heading 附近出现“拖动 / 复制 / 删除 / 更多”工具条。
2. 工具条不能出现整块实体 selection outline。
3. 双击 Heading 后原位置出现单行输入框；修改后按 Enter，文字更新且 Heading level 不变。
4. 再次双击 Heading 修改文字后按 Esc，原文字保持不变。
5. 双击 Text 后出现多行输入框；普通 Enter 可以换行，Ctrl/Cmd+Enter 提交。
6. Text 编辑时点击其他区域，失焦后提交。
7. 双击 Button 后出现单行输入框；修改后按 Enter，按钮文字更新但 href 不变。
8. 双击 Image 后出现“替换图片”对话框；修改 URL / Alt 并应用后图片更新。
9. Image 快速替换不得修改 style、responsive 或其他自定义 props。
10. 文字编辑期间 Delete / Backspace 只能编辑输入内容，不能删除组件。
11. 从快捷工具条拖动组件时仍受合法父子层级约束。
12. 点击“更多”打开与右键相同的菜单。
13. 右键菜单中的上移/下移、复制样式/粘贴样式继续正常工作。
14. Preview 中不能双击编辑 Heading/Text/Button，也不能双击 Image 打开替换面板；同时不出现面包屑、Hover Outline、快捷工具条、Context Menu、Drop Indicator 或其他 Editor Chrome。
