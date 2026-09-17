# Website Builder V1 Layout & DnD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 NocoBase Website Builder V1 上补齐可约束的组件层级、组件/图层双面板、Canvas 与图层树双向选中，以及 Canvas/图层树的同级排序和跨容器拖拽，从而形成可实际使用的 DOM-flow 零代码排版交互。

**Architecture:** Website Schema 仍是唯一业务数据；`shared/tree` 只提供纯树变换，`ComponentRegistry` 定义父子业务约束，`editor/commands` 统一执行合法插入与移动，Canvas 和 Layer Tree 只负责产生 drop intent。拖拽采用原生 HTML5 DnD + 独立 adapter，不把 drag/hover/drop UI 状态写入 Website Schema。

**Tech Stack:** TypeScript, React, Ant Design, HTML5 Drag and Drop, Node.js `node:test`, NocoBase 2.x existing client/client-v2 adapter.

**Spec:** `docs/website-builder-v1-layout-dnd-design.md`

## Global Constraints

- 不新增 `dnd-kit`、`react-dnd` 等运行时依赖；V1 使用原生 HTML5 DnD。
- `Page` 只能直接包含 `Section`。
- `Section` 可包含 `Container`、`Grid` 与内容组件，但不允许嵌套 `Section`。
- `Container` 可包含 `Grid` 与内容组件，不允许 `Section`。
- `Grid` 可包含 `Container` 与内容组件。
- `Heading/Text/Image/Button` 不能包含 children。
- Root Page 不允许移动、删除或成为另一个节点的 child。
- 节点不能移动到自身或任意 descendant。
- Canvas 与 Layer Tree 禁止直接修改 `children`；所有变更经过 Editor Command。
- Selection、hover、dragging、drop target、图层展开状态只属于编辑器 UI，不写入 Website Schema。
- Preview / Published Renderer 不显示 selection outline、empty editor hint、drop indicator 或 drag handles。

---

## File Map

### Pure tree / tests
- Modify `src/shared/tree/index.ts`: parent/location lookup、indexed insert、extract、move、reorder。
- Create `src/shared/__tests__/tree-move.test.ts`: 树移动 TDD。
- Create `src/shared/__tests__/registry-hierarchy.test.ts`: Registry 层级规则。
- Modify `src/shared/__tests__/editor-commands.test.ts`: 插入祖先回退与合法移动。

### Registry / command layer
- Modify `src/client/registry/types.ts`: `allowedChildTypes` / containment contract。
- Modify `src/client/registry/ComponentRegistry.ts`: `canContain(parentType, childType)`。
- Modify `src/client/registry/builtins.tsx`: V1 层级约束。
- Split/extend `src/client/editor/commands/`: 插入、移动、校验、更新。

### Editor state / DnD
- Modify `src/client/editor/state/types.ts` and `reducer.ts`: hover/drag/drop UI state。
- Create `src/client/editor/dnd/types.ts`.
- Create `src/client/editor/dnd/dragPayload.ts`.
- Create `src/client/editor/dnd/dropRules.ts`.
- Create `src/client/editor/dnd/index.ts`.

### Panels / Canvas
- Modify `src/client/editor/panels/ComponentPanel.tsx`: 分类、点击、palette drag。
- Create `src/client/editor/panels/LayerPanel.tsx`: 递归图层树、展开/选中、node drag/drop。
- Create `src/client/editor/panels/LeftPanel.tsx`: “组件/图层” Tabs。
- Modify `src/client/editor/canvas/Canvas.tsx`: 接收 drag/drop callbacks。
- Modify `src/client/renderer/NodeRenderer.tsx`: 编辑态节点 wrapper/drop zones，发布态不注入。
- Modify `src/client/renderer/WebsiteRenderer.tsx`: 透传 editor callbacks。
- Modify `src/client/registry/types.ts` / `builtins.tsx`: 透传 drag handle/editor metadata when editing。
- Modify `src/client/editor/WebsiteEditor.tsx`: 将 command、selection、Canvas、Layer Tree、DnD 汇合。

---

### Task 1: Pure tree location, indexed insert, move and reorder

**Files:**
- Create: `src/shared/__tests__/tree-move.test.ts`
- Modify: `src/shared/tree/index.ts`

**Interfaces:**
- Produces `findNodeLocation(root, id): { node; parent?; parentId?; index } | undefined`
- Produces `getParentNode(root, id): WebsiteNode | undefined`
- Produces `isDescendant(root, ancestorId, candidateId): boolean`
- Produces `insertNodeAt(root, parentId, node, index): WebsiteNode`
- Produces `moveNode(root, nodeId, targetParentId, targetIndex): WebsiteNode`
- Produces `reorderNode(root, parentId, fromIndex, toIndex): WebsiteNode`

- [ ] **Step 1: Write failing tests** covering insert at start/middle/end, reorder forward/backward, cross-parent move, subtree preservation, and original-document immutability.

```ts
const moved = moveNode(root, 'text-1', 'section-2', 0);
assert.deepEqual(findNode(moved, 'section-2')?.children.map((n) => n.id), ['text-1']);
assert.ok(findNode(root, 'section-1')?.children.some((n) => n.id === 'text-1'));
```

- [ ] **Step 2: Run the focused test** in the local NocoBase/package test environment and verify RED because the new functions do not exist.
- [ ] **Step 3: Implement pure functions** without importing registry/client code. Same-parent moves must compensate index after source removal.
- [ ] **Step 4: Run tree tests and existing shared tests**; require all green.
- [ ] **Step 5: Commit** `feat: add immutable tree move operations`.

### Task 2: Registry hierarchy contract

**Files:**
- Create: `src/shared/__tests__/registry-hierarchy.test.ts`
- Modify: `src/client/registry/types.ts`
- Modify: `src/client/registry/ComponentRegistry.ts`
- Modify: `src/client/registry/builtins.tsx`

**Interfaces:**
- Extend `WebsiteComponentDefinition` with `allowedChildTypes?: string[]` and optional `canContain?: (childType: string) => boolean`.
- Produce `ComponentRegistry.canContain(parentType: string, childType: string): boolean`.

- [ ] **Step 1: Write failing hierarchy tests** for Page/Section/Container/Grid/content rules.

```ts
assert.equal(componentRegistry.canContain('wb.page', 'wb.section'), true);
assert.equal(componentRegistry.canContain('wb.page', 'wb.text'), false);
assert.equal(componentRegistry.canContain('wb.container', 'wb.section'), false);
assert.equal(componentRegistry.canContain('wb.heading', 'wb.text'), false);
```

- [ ] **Step 2: Run focused tests and verify RED.**
- [ ] **Step 3: Implement registry containment rules**; unknown parent/child types return false.
- [ ] **Step 4: Run registry + tree + existing shared tests.**
- [ ] **Step 5: Commit** `feat: enforce website component hierarchy`.

### Task 3: Legal insert and move Editor Commands

**Files:**
- Modify: `src/shared/__tests__/editor-commands.test.ts`
- Create: `src/client/editor/commands/validate.ts`
- Create: `src/client/editor/commands/insert.ts`
- Create: `src/client/editor/commands/move.ts`
- Keep/update: `src/client/editor/commands/index.ts`

**Interfaces:**
- Produce `findInsertionParent(document, registry, selectedNodeId, childType): WebsiteNode | undefined`.
- Produce `insertComponent(document, registry, selectedNodeId, node): { document; inserted; parentId?; reason? }`.
- Produce `validateMove(document, registry, nodeId, targetParentId): { valid: boolean; reason?: string }`.
- Produce `moveEditorNode(document, registry, nodeId, targetParentId, targetIndex): { document; moved; reason? }`.

- [ ] **Step 1: Add failing tests**: selected Section gets Container child; selected Heading + Text falls back to nearest legal ancestor; Page rejects direct Text; root move rejected; self/descendant moves rejected; valid cross-container move succeeds.
- [ ] **Step 2: Run focused tests and verify RED.**
- [ ] **Step 3: Implement ancestor lookup + validation** using `getParentNode`, `isDescendant`, and `registry.canContain`.
- [ ] **Step 4: Replace legacy direct `insertChild` usage only after command tests pass.** Keep compatibility export if needed by existing tests.
- [ ] **Step 5: Run complete pure test group and commit** `feat: add hierarchy-aware editor commands`.

### Task 4: Layer Tree and selection synchronization

**Files:**
- Create: `src/client/editor/panels/LayerPanel.tsx`
- Create: `src/client/editor/panels/LeftPanel.tsx`
- Modify: `src/client/editor/panels/ComponentPanel.tsx`
- Modify: `src/client/editor/WebsiteEditor.tsx`

**Interfaces:**
- `LeftPanel` consumes `document`, `selectedNodeId`, `onSelect`, `onInsert` and later drag callbacks.
- `LayerPanel` recursively renders every `WebsiteNode`, displays registry labels, keeps local `expandedIds`, and calls `onSelect(node.id)`.

- [ ] **Step 1: Implement a pure helper test** for ancestor IDs if needed (`getAncestorIds`) so auto-expand logic is testable without DOM.
- [ ] **Step 2: Build `LayerPanel` recursively** with Page locked and selected row styling.
- [ ] **Step 3: Build `LeftPanel` using Ant Design Tabs: `组件` / `图层`.**
- [ ] **Step 4: Wire one `selectedNodeId` source of truth in `WebsiteEditor`** so Canvas and Layer Tree update the same reducer state.
- [ ] **Step 5: Verify existing editor behavior remains intact and commit** `feat: add layers panel and selection sync`.

### Task 5: DnD protocol and Canvas drop zones

**Files:**
- Create: `src/client/editor/dnd/types.ts`
- Create: `src/client/editor/dnd/dragPayload.ts`
- Create: `src/client/editor/dnd/dropRules.ts`
- Create: `src/client/editor/dnd/index.ts`
- Modify: `src/client/editor/state/types.ts`
- Modify: `src/client/editor/state/reducer.ts`
- Modify: `src/client/renderer/NodeRenderer.tsx`
- Modify: `src/client/renderer/WebsiteRenderer.tsx`
- Modify: `src/client/editor/canvas/Canvas.tsx`

**Interfaces:**

```ts
type DragSource =
  | { kind: 'palette'; componentType: string }
  | { kind: 'node'; nodeId: string };

interface DropTarget {
  parentId: string;
  index: number;
  position: 'before' | 'inside' | 'after';
}
```

- [ ] **Step 1: Add pure tests for drag payload encode/decode and target normalization.** Invalid JSON/unknown kind must return undefined, never throw.
- [ ] **Step 2: Extend editor state** with `hoveredNodeId`, `dragging`, `dropTarget` and reducer actions to set/clear them.
- [ ] **Step 3: Render editor-only drop zones** before/between/after children and inside empty containers. Drop indicators must use separate editor DOM/styles, not persisted node styles.
- [ ] **Step 4: Ensure `WebsiteRenderer` with no editor callbacks still renders clean published DOM** without DnD chrome.
- [ ] **Step 5: Run editor chrome + DnD pure tests and commit** `feat: add canvas drop zones`.

### Task 6: Drag components from palette into Canvas

**Files:**
- Modify: `src/client/editor/panels/ComponentPanel.tsx`
- Modify: `src/client/editor/WebsiteEditor.tsx`
- Modify: `src/client/editor/canvas/Canvas.tsx`

**Interfaces:**
- Palette drag writes `DragSource { kind: 'palette', componentType }` to `dataTransfer` using one MIME key from `dragPayload.ts`.
- Canvas drop resolves a `DropTarget`, validates through `insertComponent`/Registry, creates the WebsiteNode only after a valid drop, and selects the new node.

- [ ] **Step 1: Make component cards/buttons `draggable` and emit palette payload.** Keep click-to-insert.
- [ ] **Step 2: Replace click insertion in `WebsiteEditor` with hierarchy-aware `insertComponent`; show `message.warning(reason)` on rejection.**
- [ ] **Step 3: Wire Canvas palette drop to indexed insertion.**
- [ ] **Step 4: Manually verify: drag Container into Section; drag Heading into Container; dragging Text directly to Page shows invalid target and does not mutate Schema.**
- [ ] **Step 5: Commit** `feat: drag palette components into canvas`.

### Task 7: Drag existing nodes in Canvas and Layer Tree

**Files:**
- Modify: `src/client/registry/types.ts`
- Modify: `src/client/registry/builtins.tsx`
- Modify: `src/client/renderer/NodeRenderer.tsx`
- Modify: `src/client/editor/panels/LayerPanel.tsx`
- Modify: `src/client/editor/WebsiteEditor.tsx`

**Interfaces:**
- Existing node drag payload is `{ kind: 'node', nodeId }`.
- Both Canvas and Layer Tree submit the same `(nodeId, targetParentId, targetIndex)` intent to `WebsiteEditor.handleMove`, which calls `moveEditorNode`.

- [ ] **Step 1: Add a small editor-only drag handle or make selected node wrapper draggable** while Page remains non-draggable.
- [ ] **Step 2: Wire Canvas node drops through `moveEditorNode`.** Invalid cycle/hierarchy moves must leave document reference/data unchanged and show a warning.
- [ ] **Step 3: Add HTML5 drag/drop rows/zones to `LayerPanel`** for before/inside/after semantics.
- [ ] **Step 4: Ensure selection remains on the moved node and both Canvas/Layers re-render from the same document.**
- [ ] **Step 5: Run all pure tests and commit** `feat: reorder and reparent website nodes`.

### Task 8: Integration polish and local acceptance gate

**Files:**
- Modify: `docs/website-builder-v1-acceptance.md`
- Modify: `README.md`
- Any focused fixes found by local build/interaction testing.

**Acceptance sequence:**

```text
Page
└─ Section A
   └─ Container A
      ├─ Heading
      ├─ Text
      └─ Button
└─ Section B
   └─ Container B
```

- [ ] Click and drag components to construct the structure above.
- [ ] Reorder Text before Heading on Canvas.
- [ ] Move Button from Container A to Container B on Canvas.
- [ ] Repeat one reorder and one reparent operation in Layer Tree.
- [ ] Select nodes alternately in Canvas/Layers and verify synchronized highlight.
- [ ] Attempt Page → Text direct insertion, Container → Section, self-drop and descendant-drop; each must be rejected without corrupting the tree.
- [ ] Switch Desktop/Mobile and confirm property editing still works.
- [ ] Open Preview and confirm no layer handles, selection outlines, empty hints or drop indicators.
- [ ] Run `yarn build @lzh/plugin-website-builder` in the user's NocoBase workspace; build must exit 0 before marking this stage complete.
- [ ] Update acceptance docs with exact interactive checks and commit `docs: add layout dnd acceptance gate`.

## Plan Self-review

- Spec coverage: tree move, registry hierarchy, command validation, component/layer tabs, Canvas drops, palette drag, node drag, Layer drag, selection sync, editor-only chrome, local build/acceptance all have explicit tasks.
- No external DnD dependency is introduced.
- The same `moveEditorNode` and `insertComponent` interfaces are used by Canvas and Layer Tree; no duplicate mutation paths.
- Root/cycle/hierarchy rejection is tested before UI wiring.
- Draft/Publish work is intentionally excluded until this interaction gate passes.
