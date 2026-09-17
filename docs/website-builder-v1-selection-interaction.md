# Website Builder V1 组件选择与回溯编辑设计

## 1. 问题

网页组件存在严格父子层级后，子组件可能完全覆盖父级 Container/Grid 的可点击区域。如果只依赖 Canvas 单击，用户在后续编辑时很难重新选中父级布局节点。

V1 不重新引入实体蓝色选中框，而采用 Canvas、面包屑和图层树三路联动。

## 2. 选择入口

### Canvas

- 单击页面内容时选择鼠标命中的最内层组件。
- Hover 非 Page 节点时显示轻量淡蓝虚线和组件名称。
- Hover 虚线属于 Editor Chrome，不进入 Website Schema，也不出现在 Preview/Published。

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

## 4. 删除

非 Page 节点支持三个删除入口：

- Canvas 面包屑右侧“删除当前组件”；
- 右侧属性面板“删除”；
- 键盘 Delete / Backspace（输入框编辑时不触发）。

删除后自动选择父节点。

## 5. 自动定位

从图层树或面包屑选择节点后，Canvas 根据节点的 `data-wb-node-id` 查找真实渲染元素并执行 `scrollIntoView({ block: 'nearest', inline: 'nearest' })`。

自动定位只影响编辑器滚动位置，不修改 Schema。

## 6. 验收

```text
Page
└─ Container
   └─ Grid
      └─ Heading
```

验收步骤：

1. 点击 Heading，右侧显示 Heading 属性。
2. 点击面包屑 Grid，右侧切换为 Grid 属性。
3. 点击面包屑 Container，右侧切换为 Container 属性。
4. 在“图层”中点击 Heading，Canvas 自动定位到 Heading。
5. 鼠标 Hover Heading/Grid 时仅出现淡蓝虚线，不出现实体 selection outline。
6. Preview 中不出现面包屑、Hover Outline、Drop Indicator 或其他 Editor Chrome。
