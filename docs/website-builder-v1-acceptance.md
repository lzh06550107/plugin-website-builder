# Website Builder V1 本地部署与验收

## 1. 验收目标

本轮验收确认第一个可运行版本是否在真实 NocoBase 2.x 环境中完成以下闭环：

```text
NocoBase 后台
  → Website Builder
  → 创建站点
  → 创建页面
  → 零代码编辑组件/内容/样式
  → Desktop / Mobile
  → 保存 Draft
  → Preview
  → Publish
  → Published Version
  → 前台 Renderer
```

同时确认：修改 Draft **不会**直接修改已经发布的页面。

---

## 2. 当前插件信息

仓库：

```text
https://github.com/lzh06550107/plugin-website-builder.git
```

package name：

```text
@lzh/plugin-website-builder
```

NocoBase 版本约束：

```text
2.x
```

V1 同时保留：

```text
src/client
src/client-v2
src/server
src/shared
```

其中 Website Schema 位于 `src/shared`，不依赖 NocoBase UI；`client` 与 `client-v2` 共用同一套 Schema、Editor、Renderer 和 API contract。

---

## 3. 推荐的源码部署方式

### 3.1 不建议继续使用外部目录软链接作为第一次验收方式

之前出现过：

```text
[@nocobase/build]: 'plugin-website-builder' did not match any packages
```

NocoBase 当前 build 会扫描 `packages` 工作区中的 `package.json`，并按真实 package name 或工作区路径匹配。因此第一次验收建议直接把插件仓库放到 NocoBase 的插件工作区中。

假设 NocoBase 源码目录：

```text
~/nocobase
```

执行：

```bash
cd ~/nocobase

mkdir -p packages/plugins/@lzh

# 如果目录不存在
# git clone https://github.com/lzh06550107/plugin-website-builder.git \
#   packages/plugins/@lzh/plugin-website-builder

# 如果已经 clone 过
cd packages/plugins/@lzh/plugin-website-builder
git checkout master
git pull

cd ~/nocobase
```

如果原来不存在，则使用：

```bash
cd ~/nocobase
mkdir -p packages/plugins/@lzh
git clone https://github.com/lzh06550107/plugin-website-builder.git \
  packages/plugins/@lzh/plugin-website-builder
```

### 3.2 安装工作区依赖

回到 NocoBase 根目录：

```bash
cd ~/nocobase
yarn install
```

检查 Yarn 是否已经识别插件：

```bash
node -p "require('./packages/plugins/@lzh/plugin-website-builder/package.json').name"
```

预期：

```text
@lzh/plugin-website-builder
```

### 3.3 单独构建插件

必须使用完整 package name：

```bash
cd ~/nocobase
yarn build @lzh/plugin-website-builder
```

预期不再出现：

```text
did not match any packages
```

并且插件目录生成：

```text
packages/plugins/@lzh/plugin-website-builder/dist/
```

重点检查：

```text
dist/client/
dist/client-v2/
dist/server/
```

### 3.4 启用插件

```bash
cd ~/nocobase
yarn pm enable @lzh/plugin-website-builder
```

如果此前已经安装/启用过旧骨架版本，并且这次新增了 collection，执行：

```bash
yarn nocobase upgrade
```

然后启动你当前使用的开发服务：

```bash
yarn dev-server
```

如果你的 NocoBase 工作区当前使用的是统一开发命令，则也可按项目现有方式启动 `yarn dev`；本项目验收以你现有可正常启动的 NocoBase 命令为准。

新增语言文件后应重启一次服务。

---

## 4. 数据表检查

插件启用/upgrade 后，应存在至少以下 collection/table：

```text
wbSites
wbPages
wbPageVersions
wbThemes
```

核心关系：

```text
wbSites
  └─ wbPages
       └─ wbPageVersions

wbSites
  └─ wbThemes
```

重点字段：

### wbPages

```text
siteId
name
title
slug
routePath
status
draftSchema
publishedVersionId
seoTitle
seoDescription
```

### wbPageVersions

```text
pageId
version
schema
publishNote
```

要求：

- `(siteId, routePath)` 唯一；
- `(pageId, version)` 唯一；
- `draftSchema` 与发布版本分开保存。

---

## 5. 后台入口验收

### client-v2

当前 NocoBase 2.x 新客户端使用：

```text
插件配置 → Website Builder
```

对应路径通常为：

```text
/v/admin/settings/website-builder
```

### 旧 client

旧 client 同样注册 `Website Builder` 设置入口，用于兼容当前仍运行旧客户端的 NocoBase 工作区。

验收：

- [ ] 插件成功启用；
- [ ] 后台可以看到 Website Builder；
- [ ] 点击后无白屏；
- [ ] 浏览器控制台无 Website Builder 初始化异常；
- [ ] Site 列表能够正常请求。

---

## 6. Site 验收

点击：

```text
新建站点
```

测试数据：

```text
站点名称：Demo Company
站点标识：demo-company
```

验收：

- [ ] 创建成功；
- [ ] 页面刷新后站点仍存在；
- [ ] 重复 `demo-company` 被唯一约束阻止；
- [ ] 可以切换站点。

---

## 7. Page 验收

在 Demo Company 下创建：

```text
内部名称：Home
页面标题：首页
Slug：home
路由：/
```

验收：

- [ ] 创建成功；
- [ ] 页面状态初始为 `draft`；
- [ ] `draftSchema` 自动包含 `wb.page` 根节点；
- [ ] 点击“编辑页面”能打开全屏 Drawer 编辑器。

---

## 8. 编辑器结构验收

编辑器应至少包含：

```text
顶部：设备切换 / 预览 / 保存草稿 / 发布
左侧：组件列表
中间：Canvas
右侧：属性面板
```

验收：

- [ ] 默认选中 Page 根节点；
- [ ] 点击 Canvas 中的节点可以选中；
- [ ] 被选节点出现轮廓；
- [ ] 删除非 Page 节点有效；
- [ ] Page 根节点不能删除；
- [ ] 编辑状态下点击 Button 不应直接跳离编辑器。

---

## 9. V1 组件验收

逐个插入：

```text
Section
Container
Grid
Heading
Text
Image
Button
```

加上根节点，共八种 V1 类型：

```text
wb.page
wb.section
wb.container
wb.grid
wb.heading
wb.text
wb.image
wb.button
```

验收：

- [ ] Section 可容纳子组件；
- [ ] Container 可容纳子组件；
- [ ] Grid 默认形成 3 列；
- [ ] Grid 可修改 1～12 列；
- [ ] Heading 可修改文字及 H1～H6；
- [ ] Text 可修改文字；
- [ ] Image 可配置 URL / Alt；
- [ ] Button 可配置文字 / href。

建议搭建：

```text
Page
└─ Section
   └─ Container
      ├─ Heading
      ├─ Text
      ├─ Button
      └─ Grid
         ├─ Image
         ├─ Image
         └─ Image
```

---

## 10. 样式验收

当前属性面板至少验证：

```text
width
maxWidth
display
paddingTop
paddingBottom
color
fontSize
textAlign
background color
border radius
```

验收：

- [ ] 修改属性后 Canvas 即时变化；
- [ ] 保存草稿后关闭编辑器再打开，属性仍存在；
- [ ] 页面不是把最终 HTML 字符串保存到数据库，而是保存组件树 JSON。

---

## 11. Desktop / Mobile 响应式验收

先选择：

```text
Desktop
```

例如给 Heading：

```text
fontSize = 40px
```

再选择：

```text
Mobile
```

设置：

```text
fontSize = 24px
```

验收：

- [ ] Desktop 显示 40px；
- [ ] Mobile 显示 24px；
- [ ] Mobile 未覆盖的属性继续继承基础/既有属性；
- [ ] Mobile Canvas 宽度明显切换为移动端预览宽度。

---

## 12. Draft 保存验收

完成若干编辑后点击：

```text
保存草稿
```

验收：

- [ ] 显示保存成功；
- [ ] `wbPages.draftSchema` 更新；
- [ ] 刷新后台重新进入编辑器，组件树仍存在；
- [ ] 非法 `type`（非 `wb.*`）不能通过服务端 Schema 校验写入发布流程。

---

## 13. Preview 验收

点击：

```text
预览
```

验收：

- [ ] 弹出当前 Draft 预览；
- [ ] Preview 使用当前编辑中的 Schema；
- [ ] 不要求先 Publish；
- [ ] 关闭预览不会丢失编辑状态。

---

## 14. 首次 Publish 验收

点击：

```text
发布
```

预期：

```text
wbPages.status = published
wbPages.publishedVersionId = <version id>
wbPageVersions.version = 1
```

验收：

- [ ] 发布成功；
- [ ] 新增 `wbPageVersions` 记录；
- [ ] version 从 1 开始；
- [ ] version.schema 是发布时的完整 Website Schema；
- [ ] `publishedVersionId` 指向刚创建的版本。

---

## 15. Draft / Published 隔离验收（Release Gate 核心）

这项必须通过。

### 步骤 A

第一次发布后，在前台确认 Heading 为：

```text
版本 A
```

### 步骤 B

回后台，把 Heading 改为：

```text
版本 B（未发布）
```

只点击：

```text
保存草稿
```

**不要点击发布。**

### 步骤 C

重新打开前台发布地址。

预期：

```text
仍然显示：版本 A
```

不能显示：

```text
版本 B（未发布）
```

### 步骤 D

回后台点击发布。

预期：

```text
新增 version = 2
publishedVersionId 指向 V2
前台变为版本 B（未发布）对应的新内容
```

验收：

- [ ] Draft 修改不会污染 Published；
- [ ] 再发布创建新版本，而不是覆盖 V1；
- [ ] V1 记录仍保留；
- [ ] 前台只读取 `publishedVersionId` 指向的版本。

---

## 16. 前台 URL 验收

### 最新 client-v2

NocoBase v2 自定义客户端路由默认带 `/v` 前缀。

例如：

```text
siteKey = demo-company
routePath = /
```

访问：

```text
http://localhost:13000/v/website/demo-company/
```

如果：

```text
routePath = /about
```

访问：

```text
http://localhost:13000/v/website/demo-company/about
```

### 旧 client

旧客户端的实际前缀以你当前 NocoBase 路由模式为准；V1 也注册了兼容发布页路由。

验收：

- [ ] Published 页面能读取发布版本；
- [ ] 未发布页面显示不可用；
- [ ] 公共查询 API 不返回 Draft；
- [ ] 页面根据浏览器宽度使用 Desktop / Mobile renderer。

---

## 17. ACL 验收

V1 服务端注册三个权限片段：

```text
pm.website-builder.view
pm.website-builder.edit
pm.website-builder.publish
```

语义：

### View

允许：

```text
站点/页面/主题读取
版本读取
getDraft
getPublished
```

### Edit

允许：

```text
Site create/update/destroy
Page create/update/destroy
Theme create/update/destroy
saveDraft
```

### Publish

允许：

```text
websiteBuilder:publish
```

公开访问只放行：

```text
websiteBuilder:getPublishedByPath
```

验收建议创建三个角色：

```text
Website Viewer
Website Editor
Website Publisher
```

注意：Editor 通常需要同时授予 View + Edit；Publisher 通常需要 View + Publish，是否再给 Edit 由业务决定。

验收：

- [ ] 仅 View 不能保存；
- [ ] View + Edit 可以保存 Draft；
- [ ] 没有 Publish 权限不能发布；
- [ ] View + Publish 可以执行 Publish（前提是已有合法 Draft）；
- [ ] 匿名用户不能调用 Draft/保存/Publish API；
- [ ] 匿名用户可以读取已发布页面。

---

## 18. 数据库版本记录检查

连续发布三次后检查：

```text
wbPageVersions
```

预期：

```text
pageId | version
-------|--------
X      | 1
X      | 2
X      | 3
```

而不是始终覆盖同一行。

---

## 19. 当前 V1 已知边界

以下不作为 V1 验收失败：

- Canvas 当前为同 React 文档渲染，尚未升级为 iframe CSS 完全隔离；
- 暂无拖拽排序，V1 以“插入/选择/编辑/删除”形成零代码闭环；
- 暂无 Undo / Redo；
- 暂无组件复制/粘贴；
- 暂无 Theme Token 编辑 UI；
- 暂无 Collection 动态数据绑定；
- 暂无 Header / Footer / Carousel 等高级组件；
- 暂无 SSR / SSG；
- 前台目前由 NocoBase React Runtime 渲染；
- ACL 已有服务端权限边界，但按钮级隐藏仍可在后续版本完善；
- `client-v2` 与旧 `client` 共存，后续稳定后可逐步以 `client-v2` 为主。

这些属于后续 V1.1/V2 增强范围。

---

## 20. 验收失败时需要回传的信息

如果某一步失败，请把以下信息发回：

```text
1. NocoBase 当前 commit / version
2. Node 版本
3. yarn build @lzh/plugin-website-builder 完整错误
4. yarn dev-server 对应服务器日志
5. 浏览器控制台错误
6. Network 中失败接口的 URL / status / response
7. 出错页面截图
```

如果是数据库问题，再附：

```text
wbSites
wbPages
wbPageVersions
wbThemes
```

是否成功创建。

---

## 21. V1 通过标准

只有以下全部成立，V1 才视为完成本地验收：

- [ ] 插件 build 成功；
- [ ] 插件 enable/upgrade 成功；
- [ ] NocoBase 正常启动；
- [ ] Website Builder 后台入口可访问；
- [ ] Site/Page 可创建；
- [ ] 八种基础节点可正常工作；
- [ ] 内容/基础样式可零代码修改；
- [ ] Desktop/Mobile 可分别配置；
- [ ] Draft 可保存并恢复；
- [ ] Preview 正常；
- [ ] Publish 正常；
- [ ] `wbPageVersions` 正确递增；
- [ ] Draft/Published 隔离通过；
- [ ] client-v2 发布页可以访问；
- [ ] ACL 最小权限边界通过。

验收通过后再进入 V1.1：拖拽排序、iframe Canvas、Undo/Redo、Theme Token 与更完整样式面板。
