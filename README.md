# @lzh/plugin-website-builder

NocoBase 2.x Website Builder 插件：在 NocoBase 后台零代码编辑前台网页的组件结构、层级、内容、排版和响应式样式，并通过 Draft → Publish Version 发布到前台。

## V1 能力

- Site / Page 管理
- Page / Section / Container / Grid / Heading / Text / Image / Button
- 组件父子层级约束
- “组件 / 图层”双面板
- Canvas 与图层树双向选中
- 左侧组件拖入 Canvas
- Canvas 同级拖拽排序
- Canvas 跨容器移动
- 图层树同级排序与跨父级移动
- 非法父子层级、自身和 descendant 移动阻止
- Flex / Grid 基础零代码排版
- Width / MaxWidth / MinHeight / Gap
- 四边 Margin / Padding
- Desktop / Mobile 响应式样式
- 编辑态空容器命中区与 Drop Indicator
- Preview / Published Renderer 不注入编辑器辅助 UI
- 草稿保存与预览
- 不可变发布版本
- 已发布页面渲染
- View / Edit / Publish 三类 ACL snippet
- `client` 与 `client-v2` 入口

## 架构原则

```text
Website Schema
      ↓
shared/tree 纯树变换
      ↓
Component Registry 层级规则
      ↓
Editor Commands
      ↓
Canvas / Layer Tree
```

Canvas 和图层树不直接修改 `children`。拖拽统一转成 `parentId + index` 的 Drop Target，再通过 Editor Command 校验和修改 Website Schema。

V1 拖拽使用浏览器原生 HTML5 Drag and Drop，没有新增 `dnd-kit` / `react-dnd` 运行时依赖。

## 文档

- V1 架构设计：`docs/website-builder-v1-design.md`
- V1 初始实现计划：`docs/website-builder-v1-implementation-plan.md`
- 组件层级 / 拖拽设计：`docs/website-builder-v1-layout-dnd-design.md`
- 组件层级 / 拖拽实现计划：`docs/website-builder-v1-layout-dnd-implementation-plan.md`
- 本地安装与验收：`docs/website-builder-v1-acceptance.md`

验收顺序：

```text
Gate A：组件层级 / Canvas 拖拽 / 图层树 / 零代码排版
  ↓
Gate B：Draft / Publish / Version / ACL
```

Gate A 未通过前，不进入 Draft / Publish Release Gate。

## 包名

插件真实 package name：

```text
@lzh/plugin-website-builder
```

在 NocoBase 源码仓库中单独构建：

```bash
yarn build @lzh/plugin-website-builder
```

不要使用：

```bash
yarn build plugin-website-builder
```
