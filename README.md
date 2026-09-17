# @lzh/plugin-website-builder

NocoBase 2.x Website Builder 插件：在 NocoBase 后台零代码编辑前台网页的组件结构、内容、排版和响应式样式，并通过 Draft → Publish Version 发布到前台。

## V1 能力

- Site / Page 管理
- Page / Section / Container / Grid / Heading / Text / Image / Button
- Desktop / Mobile 响应式样式
- 可视化组件插入、选中、属性编辑和删除
- 草稿保存与预览
- 不可变发布版本
- 已发布页面渲染
- View / Edit / Publish 三类 ACL snippet
- `client` 与 `client-v2` 入口

## 文档

- 架构设计：`docs/website-builder-v1-design.md`
- 实现计划：`docs/website-builder-v1-implementation-plan.md`
- 本地安装与验收：`docs/website-builder-v1-acceptance.md`

## 包名

插件真实 package name 是：

```text
@lzh/plugin-website-builder
```

因此在 NocoBase 源码仓库中单独构建时，请使用：

```bash
yarn build @lzh/plugin-website-builder
```

不要使用 `yarn build plugin-website-builder`。
