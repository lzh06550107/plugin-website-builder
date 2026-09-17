# Website Builder V1 本地部署与验收

## 1. 验收原则

V1 现在分两个 Gate 验收，顺序不可颠倒：

```text
Gate A：零代码编辑交互
  → 组件层级
  → 组件 / 图层双面板
  → Canvas 拖拽
  → 图层树拖拽
  → 同级排序 / 跨容器移动
  → Flex / Grid / 间距 / 响应式排版
  → Preview 不含编辑器辅助 UI

Gate B：持久化与发布
  → Save Draft
  → 重新加载
  → Preview
  → Publish
  → Published Version
  → Draft / Published 隔离
  → ACL
```

**Gate A 未通过，不进入 Gate B。**

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

NocoBase：`2.x`。

V1 源码结构：

```text
src/client
src/client-v2
src/server
src/shared
```

Website Schema 位于 `src/shared`，编辑器只修改结构化组件树，不把最终 HTML 作为源数据保存。

---

## 3. 本地更新与构建

插件位于 NocoBase 工作区时：

```bash
cd ~/nocobase/packages/plugins/@lzh/plugin-website-builder
git checkout master
git pull

cd ~/nocobase
yarn install
yarn build @lzh/plugin-website-builder
```

必须使用完整包名：

```text
@lzh/plugin-website-builder
```

不要使用：

```text
plugin-website-builder
```

如果插件尚未启用：

```bash
yarn pm enable @lzh/plugin-website-builder
```

如果此前启用的是旧骨架并且 Collection 尚未升级：

```bash
yarn nocobase upgrade
```

然后重新启动当前开发服务，例如：

```bash
yarn dev-server
```

构建 Gate：

- [ ] `yarn build @lzh/plugin-website-builder` exit code = 0；
- [ ] `dist/client` 存在；
- [ ] `dist/client-v2` 存在；
- [ ] `dist/server` 存在；
- [ ] NocoBase 启动无 Website Builder 初始化异常。

---

## 4. 后台入口

打开：

```text
/v/admin/settings/website-builder
```

验收：

- [ ] Website Builder 设置页正常打开；
- [ ] Site 列表可读取；
- [ ] Page 列表可读取；
- [ ] 点击“编辑页面”可以进入编辑器；
- [ ] 浏览器控制台没有 Website Builder 初始化错误。

---

## 5. Site / Page 基础数据

建议使用：

```text
站点名称：Demo Company
站点标识：demo-company

页面名称：Home
页面标题：首页
Slug：home
Route：/
```

验收：

- [ ] Site 创建成功并可刷新恢复；
- [ ] 重复 site key 被唯一约束阻止；
- [ ] Page 创建成功；
- [ ] Page 初始状态为 draft；
- [ ] `draftSchema` 包含 `wb.page` 根节点。

---

# Gate A：零代码编辑交互

## 6. 编辑器结构

编辑器应为：

```text
┌──────────────────────────────────────────────────────────────┐
│ Desktop / Mobile                 预览  保存草稿  发布         │
├──────────────┬──────────────────────────────┬────────────────┤
│ 组件 | 图层  │            Canvas            │      属性      │
└──────────────┴──────────────────────────────┴────────────────┘
```

验收：

- [ ] 左侧存在“组件 / 图层”两个 Tab；
- [ ] 中间 Canvas 可选择节点；
- [ ] 右侧属性面板随选中节点变化；
- [ ] Page 根节点不能删除；
- [ ] Page 根节点不能拖动；
- [ ] 空 Section / Container / Grid 有足够的编辑命中区域。

---

## 7. 组件层级规则

V1 固定规则：

```text
Page
└─ Section
   ├─ Container
   │  ├─ Grid
   │  ├─ Heading
   │  ├─ Text
   │  ├─ Image
   │  └─ Button
   ├─ Grid
   ├─ Heading
   ├─ Text
   ├─ Image
   └─ Button
```

其中：

```text
Page      → 只能直接放 Section
Section   → Container / Grid / 内容组件
Container → Grid / 内容组件
Grid      → Container / 内容组件
内容组件  → 不允许 children
```

特别验证：

- [ ] 选中 Page 点击 Text，不允许直接插入；
- [ ] 选中 Page 点击 Section，可以插入；
- [ ] 选中 Section 点击 Container，可以插入；
- [ ] 选中 Container 点击 Section，被拒绝；
- [ ] 选中 Heading 后点击 Text，Text 自动插到最近合法父容器中，成为 Heading 的同级；
- [ ] Section 不允许嵌套 Section。

---

## 8. 建立标准验收页面

使用“点击插入 + 拖拽”共同搭建：

```text
Page
├─ Section A
│  └─ Container A
│     ├─ Heading
│     ├─ Text
│     └─ Button
└─ Section B
   └─ Container B
```

推荐内容：

```text
Heading：金亚包装
Text：专业包装印刷解决方案
Button：了解更多
```

验收：

- [ ] 左侧组件点击插入有效；
- [ ] 左侧组件可以直接拖入 Canvas；
- [ ] Palette 拖动过程中不会提前修改 Schema；
- [ ] 只有合法 drop 后才创建新节点；
- [ ] 新建节点 drop 后自动成为当前选中节点。

---

## 9. Canvas 拖拽排序

在 `Container A` 中验证：

```text
原顺序：
Heading
Text
Button

拖动后：
Text
Heading
Button
```

验收：

- [ ] 已有节点可直接拖动；
- [ ] 节点上方 / 下方出现 Drop Indicator；
- [ ] 合法位置显示蓝色提示；
- [ ] 非法位置显示红色/禁止提示；
- [ ] 同父级向前排序正确；
- [ ] 同父级向后排序正确；
- [ ] 拖回原位置不会无故把文档标记成有变化；
- [ ] 排序后节点 id 不变；
- [ ] 子树内容完整保留。

---

## 10. Canvas 跨容器移动

把：

```text
Container A / Button
```

拖到：

```text
Container B
```

预期：

```text
Section A
└─ Container A
   ├─ Text
   └─ Heading

Section B
└─ Container B
   └─ Button
```

验收：

- [ ] 跨父级移动成功；
- [ ] 原父节点不再包含该节点；
- [ ] 新父节点包含原节点；
- [ ] 节点 id、props、style、responsive、children 全部保留；
- [ ] 移动后仍保持该节点选中。

非法移动必须拒绝：

- [ ] Page 被拖动；
- [ ] 节点拖入自身；
- [ ] 节点拖入自己的 descendant；
- [ ] Section 拖入 Container；
- [ ] Text/Heading/Button/Image 作为父容器接收其他节点。

非法移动不能产生半完成状态或损坏组件树。

---

## 11. 图层树验收

打开左侧“图层”：

```text
Page
├─ Section
│  └─ Container
│     ├─ Text
│     └─ Heading
└─ Section
   └─ Container
      └─ Button
```

验收：

- [ ] 图层树结构与 Canvas/Schema 一致；
- [ ] 点击图层节点，Canvas 同步高亮；
- [ ] 点击 Canvas 节点，图层树同步选中；
- [ ] 选择深层节点时祖先层级自动展开；
- [ ] Page 在图层树中不可拖动；
- [ ] 图层树支持同父级排序；
- [ ] 图层树支持跨合法父容器移动；
- [ ] 图层树与 Canvas 的移动结果一致；
- [ ] 非法层级移动被命令层拒绝。

---

## 12. 零代码排版属性

右侧属性面板至少验证：

```text
width
maxWidth
minHeight

display: block / flex / grid
flexDirection
justifyContent
alignItems
gap
gridTemplateColumns

padding: top / right / bottom / left
margin: top / right / bottom / left

fontSize
color
textAlign
backgroundColor
borderRadius
```

建议对 `Container A` 设置：

```text
display = flex
flexDirection = column
gap = 24px
paddingTop = 40px
paddingRight = 32px
paddingBottom = 40px
paddingLeft = 32px
```

再切换为：

```text
display = flex
flexDirection = row
justifyContent = space-between
alignItems = center
```

验收：

- [ ] 每个属性修改后 Canvas 立即变化；
- [ ] Flex 主轴/交叉轴配置有效；
- [ ] Gap 有效；
- [ ] 四边 Padding 可独立设置；
- [ ] 四边 Margin 可独立设置；
- [ ] Grid 列数与 Grid Template 生效；
- [ ] 用户无需输入 HTML/React 代码即可完成排版。

---

## 13. Desktop / Mobile 响应式

Desktop：

```text
Heading fontSize = 40px
Container paddingLeft = 32px
```

Mobile：

```text
Heading fontSize = 24px
Container paddingLeft = 16px
```

验收：

- [ ] Desktop / Mobile 可切换；
- [ ] Mobile Canvas 使用移动端宽度；
- [ ] 两个设备的覆盖值互不覆盖；
- [ ] 未配置值继续继承已有样式。

---

## 14. Preview 编辑器隔离

点击“预览”。

Preview 中不得出现：

```text
空 Section 提示文字
空 Container 提示文字
selection outline
Drop Indicator
图层树
拖拽辅助边框
编辑器专用 draggable 元数据造成的行为变化
```

验收：

- [ ] Preview 只显示网页本身；
- [ ] 空容器编辑高度不污染 Preview；
- [ ] Drop Indicator 不进入 Website Schema；
- [ ] 编辑器辅助 UI 不进入 Published Renderer。

**Gate A 到此全部通过后，才进入以下 Gate B。**

---

# Gate B：Draft / Publish / ACL

## 15. Draft 保存与重新加载

在标准验收页面上点击：

```text
保存草稿
```

关闭编辑器，再重新进入。

验收：

- [ ] 组件层级完整恢复；
- [ ] 排序结果完整恢复；
- [ ] 跨容器移动结果完整恢复；
- [ ] Desktop/Mobile 样式完整恢复；
- [ ] `wbPages.draftSchema` 更新；
- [ ] 保存的是 Website Schema JSON，而不是最终 HTML。

---

## 16. 首次 Publish

点击“发布”，预期：

```text
wbPages.status = published
wbPages.publishedVersionId = <version id>
wbPageVersions.version = 1
```

验收：

- [ ] 新增 V1 版本；
- [ ] version.schema 为发布时完整 Schema；
- [ ] publishedVersionId 指向 V1。

---

## 17. Draft / Published 隔离（Release Gate）

1. 发布 Heading=`版本 A`。
2. 后台修改为 `版本 B（未发布）`。
3. 只点“保存草稿”，不要发布。
4. 访问前台 Published 页面。

必须仍显示：

```text
版本 A
```

再次发布后：

```text
V2 新增
publishedVersionId → V2
前台显示版本 B
V1 仍保留
```

验收：

- [ ] Draft 修改不会污染 Published；
- [ ] 发布创建不可变新版本；
- [ ] 旧版本不会被覆盖。

---

## 18. 前台 URL

例如：

```text
siteKey = demo-company
routePath = /
```

访问：

```text
http://localhost:13000/v/website/demo-company/
```

验收：

- [ ] Published 页面可访问；
- [ ] 未发布页面不能从 Public API 读取 Draft；
- [ ] 前台只读取 Published Version；
- [ ] Desktop/Mobile Renderer 正常。

---

## 19. ACL

服务端权限片段：

```text
pm.website-builder.view
pm.website-builder.edit
pm.website-builder.publish
```

验收：

- [ ] 仅 View 不能保存；
- [ ] View + Edit 可以保存 Draft；
- [ ] 无 Publish 权限不能发布；
- [ ] View + Publish 可发布已有合法 Draft；
- [ ] 匿名用户不能读取 Draft、保存或发布；
- [ ] 匿名用户可以读取 Published 页面。

---

## 20. V1 当前边界

以下暂不作为本阶段失败：

- Canvas 仍在当前 React 文档内，尚未升级 iframe CSS 完全隔离；
- 暂无 Undo / Redo；
- 暂无复制 / 粘贴；
- 暂无多选；
- 暂无绝对定位自由画布；
- 暂无 Grid 单元格拖动拉伸；
- 暂无 Theme Token 完整 UI；
- 暂无 Collection 动态数据绑定；
- 暂无 Header / Footer / Carousel 等高级组件；
- 暂无 SSR / SSG。

**拖拽排序、跨容器移动、图层树和 Flex/Grid 基础排版已经属于 V1 Gate A，不再列为后续能力。**

---

## 21. 失败时回传

请提供：

```text
1. NocoBase commit / version
2. Node 版本
3. yarn build @lzh/plugin-website-builder 完整输出
4. yarn dev-server 对应日志
5. 浏览器 Console 错误
6. Network 失败请求 URL / status / response
7. 出错页面截图
8. 精确复现步骤
```

如果是拖拽问题，请特别说明：

```text
拖动源：哪个组件
原父节点：哪个组件
目标节点：哪个组件
期望 before / inside / after 哪个位置
实际结果
```

---

## 22. V1 最终通过标准

Gate A：

- [ ] 组件层级约束通过；
- [ ] 点击插入按最近合法父节点工作；
- [ ] Palette → Canvas 拖入通过；
- [ ] Canvas 同级排序通过；
- [ ] Canvas 跨容器移动通过；
- [ ] 图层树排序 / 跨容器移动通过；
- [ ] Canvas / Layers 双向选中通过；
- [ ] 自身/后代/非法父子移动全部拒绝；
- [ ] Flex / Grid / Margin / Padding / Gap 排版通过；
- [ ] Desktop / Mobile 通过；
- [ ] Preview 无编辑器辅助 UI。

Gate B：

- [ ] Draft 保存/恢复通过；
- [ ] Publish 通过；
- [ ] Page Version 正确递增；
- [ ] Draft / Published 隔离通过；
- [ ] Published URL 通过；
- [ ] ACL 最小权限边界通过。

只有 Gate A + Gate B 全部通过，V1 才视为完成。
