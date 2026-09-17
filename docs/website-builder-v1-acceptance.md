# Website Builder V1 本地部署与验收

## 1. 验收原则

V1 分两个 Gate，顺序不可颠倒：

```text
Gate A：零代码编辑交互
  → 严格组件层级
  → 组件 / 图层双面板
  → 点击插入 / Canvas 拖拽
  → 图层树拖拽
  → 删除
  → 零代码排版
  → Desktop / Mobile
  → Preview 编辑器隔离

Gate B：持久化与发布
  → Save Draft
  → 重新加载
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

当前交互开发分支：

```text
feature/layout-dnd-v1
```

NocoBase：`2.x`。

---

## 3. 本地更新与构建

当前 Gate A 验收使用功能分支：

```bash
cd ~/nocobase/packages/plugins/@lzh/plugin-website-builder

git fetch
git checkout feature/layout-dnd-v1
git pull

cd ~/nocobase
yarn install
yarn build @lzh/plugin-website-builder
```

构建 Gate：

- [ ] `yarn build @lzh/plugin-website-builder` exit code = 0；
- [ ] `dist/client` 存在；
- [ ] `dist/client-v2` 存在；
- [ ] `dist/server` 存在；
- [ ] NocoBase 启动无 Website Builder 初始化异常。

如果插件尚未启用：

```bash
yarn pm enable @lzh/plugin-website-builder
```

如果此前是旧 Collection 版本：

```bash
yarn nocobase upgrade
```

然后重新启动，例如：

```bash
yarn dev-server
```

---

## 4. 后台入口

打开：

```text
/v/admin/settings/website-builder
```

验收：

- [ ] Website Builder 设置页正常打开；
- [ ] Site / Page 列表正常；
- [ ] 点击“编辑页面”进入编辑器；
- [ ] 浏览器控制台没有 Website Builder 初始化错误。

---

# Gate A：零代码编辑交互

## 5. 编辑器结构

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
- [ ] Page 根节点不能删除、不能拖动；
- [ ] 选中节点不再出现蓝色实体外框；
- [ ] 空 Page / Container / Grid 仍有虚线可操作区域。

> `Section` 仅为旧 Schema 兼容保留，新建组件面板不再显示 Section。

---

## 6. V1 严格组件层级

新建页面必须遵循：

```text
Page
├─ Container A
│  ├─ Grid A1
│  │  ├─ Heading
│  │  ├─ Text
│  │  ├─ Image
│  │  └─ Button
│  └─ Grid A2
└─ Container B
   └─ Grid B1
```

父子约束：

```text
Page      → 仅 Container
Container → 仅 Grid
Grid      → Heading / Text / Image / Button
内容组件  → 不允许 children
```

验收顺序：

1. 选中 Page。
2. 此时只允许新增 Container；Grid 和内容组件应 disabled。
3. 新增 Container 并选中它。
4. 此时只允许新增 Grid；内容组件应 disabled。
5. 新增 Grid 并选中它。
6. 此时允许 Heading / Text / Image / Button。
7. 选中 Heading 后，继续新增 Text 时，Text 可作为同一个 Grid 的同级节点。
8. 选中 Grid 时新增 Container 应被拒绝，而不是偷偷插入到 Page。

验收：

- [ ] 组件面板会提前禁用当前层级不允许的组件；
- [ ] 点击插入不能产生非法树；
- [ ] Canvas 拖拽不能产生非法树；
- [ ] 图层树拖拽不能产生非法树；
- [ ] 页面不会出现 `Page → Text`；
- [ ] 页面不会出现 `Container → Text`；
- [ ] 页面不会出现 `Grid → Container`。

---

## 7. 旧 Section 数据兼容

旧 Draft 可能仍包含：

```text
Page
└─ Section
```

本阶段策略：

- Section 继续渲染，避免旧页面立即损坏；
- 新建组件列表隐藏 Section；
- 旧 Section 暂时只允许放 Container；
- 可以直接删除旧 Section，然后按新结构重建；
- 后续单独实现 Schema migration，不在本 Gate 自动改写旧数据。

验收：

- [ ] 老 Section 能显示；
- [ ] 老 Section 能删除；
- [ ] 删除后 Page 可新增 Container。

---

## 8. 删除组件

删除入口固定在右侧属性面板顶部。

除 Page 外，选中任意节点后：

```text
属性                  [删除]
wb.grid / desktop
```

同时支持：

```text
Delete
Backspace
```

但光标位于 `Input / Textarea / Select / contenteditable` 时，Backspace/Delete 只编辑文本，不删除节点。

验收：

- [ ] Container 可删除；
- [ ] Grid 可删除；
- [ ] Heading/Text/Image/Button 可删除；
- [ ] 删除后自动选中父节点；
- [ ] Page 没有删除按钮；
- [ ] Page 按 Delete 不会消失。

---

## 9. 标准验收页面

建议搭建：

```text
Page
├─ Container A
│  └─ Grid A
│     ├─ Heading：金亚包装
│     ├─ Text：专业包装印刷解决方案
│     └─ Button：了解更多
└─ Container B
   └─ Grid B
```

验收：

- [ ] 点击插入可以完成完整结构；
- [ ] 左侧 Palette 可以拖入 Canvas；
- [ ] 只有合法 Drop 才创建节点；
- [ ] Drop 后新节点自动选中。

---

## 10. Canvas 拖拽排序

在 `Grid A` 中：

```text
原顺序：Heading / Text / Button
目标：Text / Heading / Button
```

验收：

- [ ] 内容节点可同 Grid 排序；
- [ ] Container 可在 Page 下排序；
- [ ] Grid 可在同 Container 下排序；
- [ ] 合法位置显示蓝色 Drop Indicator；
- [ ] 非法位置显示禁止状态；
- [ ] 拖回原位置不产生无意义文档变更；
- [ ] 排序后 node id、props、style、responsive 不变。

---

## 11. 跨父级移动

合法示例：

```text
Grid A / Button
      ↓
Grid B / Button
```

以及：

```text
Container A / Grid A2
      ↓
Container B / Grid A2
```

非法示例：

```text
Text      → Container
Grid      → Page
Container → Grid
节点      → 自己
父节点    → 自己的 descendant
Page      → 任意位置
```

验收：

- [ ] 合法跨父级移动成功；
- [ ] 非法移动不改变 Schema；
- [ ] Canvas 和图层树遵循相同结果。

---

## 12. 图层树

标准结构应显示：

```text
Page
├─ Container A
│  └─ Grid A
│     ├─ Text
│     ├─ Heading
│     └─ Button
└─ Container B
   └─ Grid B
```

验收：

- [ ] 图层树与 Canvas/Schema 一致；
- [ ] Canvas 点击后图层同步选中；
- [ ] 图层点击后属性面板同步；
- [ ] 深层节点被选中时 ancestor 自动展开；
- [ ] 图层树支持合法排序和跨父级移动；
- [ ] 图层树拖动阶段就禁止非法 Drop。

---

## 13. 零代码排版

右侧属性面板至少验证：

```text
width / maxWidth / minHeight
block / flex / grid
flexDirection
justifyContent
alignItems
gap
grid columns / gridTemplateColumns
padding top/right/bottom/left
margin top/right/bottom/left
fontSize / color / textAlign
backgroundColor / borderRadius
```

建议对 Container 设置：

```text
display = flex
flexDirection = column
gap = 24px
paddingTop = 40px
paddingRight = 32px
paddingBottom = 40px
paddingLeft = 32px
```

验收：

- [ ] 修改立即反映到 Canvas；
- [ ] 四边 Margin/Padding 可分别配置；
- [ ] Flex 对齐和 Gap 生效；
- [ ] Grid 列数生效；
- [ ] 不需要写 HTML/CSS/React 代码。

---

## 14. Desktop / Mobile

示例：

```text
Desktop Heading fontSize = 40px
Mobile  Heading fontSize = 24px
```

验收：

- [ ] Desktop/Mobile 可以切换；
- [ ] Mobile Canvas 使用移动端宽度；
- [ ] 两端覆盖值互不覆盖；
- [ ] 未覆盖值继续继承。

---

## 15. Preview 编辑器隔离

Preview 中不得出现：

```text
空 Page/Container/Grid 虚线提示
蓝色/红色 Drop Indicator
选中实体线框
图层树
删除按钮
编辑器拖拽行为
```

验收：

- [ ] Preview 只显示网页本身；
- [ ] 编辑态临时 minHeight 不污染 Preview；
- [ ] Editor Chrome 不进入 Website Schema；
- [ ] Published Renderer 同样不带编辑辅助 UI。

**Gate A 全部通过后，再进入 Gate B。**

---

# Gate B：Draft / Publish / ACL

## 16. Draft 保存与重新加载

点击“保存草稿”，关闭编辑器，再重新进入。

验收：

- [ ] `Page → Container → Grid → Content` 层级完整恢复；
- [ ] 排序和跨 Grid/Container 移动结果恢复；
- [ ] Desktop/Mobile 样式恢复；
- [ ] `wbPages.draftSchema` 更新；
- [ ] 数据库保存的是 Website Schema JSON，而不是最终 HTML。

---

## 17. Publish 与不可变版本

首次发布预期：

```text
wbPages.status = published
wbPages.publishedVersionId = <version id>
wbPageVersions.version = 1
```

再次发布产生 V2，而不是覆盖 V1。

验收：

- [ ] Version 从 1 递增；
- [ ] 每个版本保存完整 Schema；
- [ ] publishedVersionId 指向当前发布版本；
- [ ] 历史版本仍保留。

---

## 18. Draft / Published 隔离

1. 发布 Heading=`版本 A`。
2. 后台修改为 `版本 B（未发布）`。
3. 只点“保存草稿”。
4. 访问前台。

必须仍显示：

```text
版本 A
```

再次发布后才变为版本 B。

验收：

- [ ] Draft 不污染 Published；
- [ ] 发布创建不可变新版本。

---

## 19. 前台 URL

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
- [ ] Public API 不返回 Draft；
- [ ] Desktop/Mobile Renderer 正常。

---

## 20. ACL

权限片段：

```text
pm.website-builder.view
pm.website-builder.edit
pm.website-builder.publish
```

验收：

- [ ] 仅 View 不能保存；
- [ ] View + Edit 可保存 Draft；
- [ ] 无 Publish 权限不能发布；
- [ ] 匿名用户不能读取 Draft 或执行编辑/发布；
- [ ] 匿名用户仅能读取 Published 页面。

---

## 21. 回传问题时需要的信息

如果失败，请提供：

```text
1. 当前插件 branch / commit
2. NocoBase version / commit
3. Node 版本
4. yarn build @lzh/plugin-website-builder 完整输出
5. yarn dev-server 相关日志
6. 浏览器 Console
7. Network 失败请求 URL/status/response
8. 对应页面截图
```

Gate A 的 UI 问题优先提供截图；构建问题优先提供完整 build 输出。
