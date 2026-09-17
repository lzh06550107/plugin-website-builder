import React, { useMemo, useReducer } from 'react';
import { message, Modal } from 'antd';
import type { WebsiteNode, WebsiteStyle } from '../../shared/schema';
import { createNode } from '../../shared/schema';
import { findNode } from '../../shared/tree';
import { componentRegistry } from '../registry';
import { WebsiteRenderer } from '../renderer';
import { Canvas } from './canvas/Canvas';
import {
  convertLegacySection,
  copyEditorNodeStyle,
  deleteEditorNode,
  duplicateEditorNode,
  findInsertionParent,
  insertComponent,
  moveEditorNode,
  moveEditorNodeRelative,
  pasteEditorNodeStyle,
  updateNodeProps,
  updateNodeStyle,
} from './commands';
import type { WebsiteNodeStyleClipboard } from './commands';
import type { DragSource, DropTarget } from './dnd';
import { validateDropSource } from './dnd';
import { EditorSidebar } from './panels/EditorSidebar';
import { PropertyPanel } from './panels/PropertyPanel';
import { createEditorState, editorReducer } from './state';
import { EditorToolbar } from './toolbar/EditorToolbar';

export interface WebsiteEditorProps {
  initialDocument: WebsiteNode;
  saving?: boolean;
  publishing?: boolean;
  onSave?: (document: WebsiteNode) => Promise<void> | void;
  onPublish?: (document: WebsiteNode) => Promise<void> | void;
}

let nodeSequence = 0;
function nextNodeId(type: string) {
  nodeSequence += 1;
  return `${type.replace('wb.', '')}-${Date.now().toString(36)}-${nodeSequence}`;
}

function isEditingText(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName;
  return element.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function WebsiteEditor({ initialDocument, saving, publishing, onSave, onPublish }: WebsiteEditorProps) {
  const [state, dispatch] = useReducer(editorReducer, initialDocument, createEditorState);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [styleClipboard, setStyleClipboard] = React.useState<WebsiteNodeStyleClipboard>();
  const selectedNode = useMemo(
    () => (state.selectedNodeId ? findNode(state.document, state.selectedNodeId) : undefined),
    [state.document, state.selectedNodeId],
  );

  const replaceDocument = (document: WebsiteNode) => dispatch({ type: 'replace-document', document, markDirty: true });

  const handleCanInsert = (type: string) =>
    Boolean(findInsertionParent(state.document, componentRegistry, state.selectedNodeId, type));

  const handleInsert = (type: string) => {
    const node = createNode(type, nextNodeId(type));
    const result = insertComponent(state.document, componentRegistry, state.selectedNodeId, node);
    if (!result.inserted) {
      message.warning(result.reason || '当前层级无法插入该组件');
      return;
    }
    replaceDocument(result.document);
    dispatch({ type: 'select', nodeId: node.id });
  };

  const handleCanDrop = (source: DragSource, target: DropTarget) =>
    validateDropSource(state.document, componentRegistry, source, target).valid;

  const handleMoveNode = (nodeId: string, target: DropTarget) => {
    const result = moveEditorNode(state.document, componentRegistry, nodeId, target.parentId, target.index);
    if (!result.moved) {
      if (result.reason && result.reason !== '组件位置没有发生变化') message.warning(result.reason);
      return;
    }
    replaceDocument(result.document);
    dispatch({ type: 'select', nodeId });
  };

  const handleDrop = (source: DragSource, target: DropTarget) => {
    if (source.kind === 'palette') {
      const node = createNode(source.componentType, nextNodeId(source.componentType));
      const result = insertComponent(state.document, componentRegistry, undefined, node, {
        parentId: target.parentId,
        index: target.index,
      });
      if (!result.inserted) {
        message.warning(result.reason || '无法在这里放置组件');
        return;
      }
      replaceDocument(result.document);
      dispatch({ type: 'select', nodeId: node.id });
      return;
    }

    handleMoveNode(source.nodeId, target);
  };

  const handlePropsChange = (patch: Record<string, unknown>) => {
    if (!selectedNode) return;
    replaceDocument(updateNodeProps(state.document, selectedNode.id, patch));
  };

  const handleStyleChange = (patch: Partial<WebsiteStyle>) => {
    if (!selectedNode) return;
    replaceDocument(updateNodeStyle(state.document, selectedNode.id, state.device, patch));
  };

  const handleDeleteNode = React.useCallback((nodeId: string) => {
    const result = deleteEditorNode(state.document, nodeId);
    if (!result.deleted) {
      if (result.reason) message.warning(result.reason);
      return;
    }
    replaceDocument(result.document);
    dispatch({ type: 'select', nodeId: result.parentId || state.document.id });
  }, [state.document]);

  const handleDuplicateNode = React.useCallback((nodeId: string) => {
    const result = duplicateEditorNode(state.document, nodeId, (node) => nextNodeId(node.type));
    if (!result.duplicated) {
      if (result.reason) message.warning(result.reason);
      return;
    }
    replaceDocument(result.document);
    dispatch({ type: 'select', nodeId: result.nodeId || nodeId });
  }, [state.document]);

  const handleMoveNodeRelative = React.useCallback((nodeId: string, direction: 'up' | 'down') => {
    const result = moveEditorNodeRelative(state.document, nodeId, direction);
    if (!result.moved) {
      if (result.reason && !result.reason.startsWith('已经是')) message.warning(result.reason);
      return;
    }
    replaceDocument(result.document);
    dispatch({ type: 'select', nodeId });
  }, [state.document]);

  const handleCopyNodeStyle = React.useCallback((nodeId: string) => {
    const result = copyEditorNodeStyle(state.document, nodeId);
    if (!result.copied || !result.clipboard) {
      if (result.reason) message.warning(result.reason);
      return;
    }
    setStyleClipboard(result.clipboard);
    const source = findNode(state.document, nodeId);
    const label = source ? componentRegistry.get(source.type)?.label || source.type : '组件';
    message.success(`已复制 ${label} 样式`);
  }, [state.document]);

  const handlePasteNodeStyle = React.useCallback((nodeId: string) => {
    if (!styleClipboard) {
      message.warning('请先复制一个组件的样式');
      return;
    }
    const result = pasteEditorNodeStyle(state.document, nodeId, styleClipboard);
    if (!result.pasted) {
      if (result.reason) message.warning(result.reason);
      return;
    }
    replaceDocument(result.document);
    dispatch({ type: 'select', nodeId });
    message.success('样式已粘贴');
  }, [state.document, styleClipboard]);

  const handleDelete = React.useCallback(() => {
    if (!selectedNode) return;
    handleDeleteNode(selectedNode.id);
  }, [handleDeleteNode, selectedNode]);

  const handleConvertLegacySection = React.useCallback(() => {
    if (!selectedNode || selectedNode.type !== 'wb.section') return;

    Modal.confirm({
      title: '转换旧 Section 为新结构？',
      content: '转换只修改当前编辑中的 Schema。新结构会使用 Page → Container → Grid → 内容，只有点击“保存草稿”后才会写入数据库。',
      okText: '转换',
      cancelText: '取消',
      onOk: () => {
        const result = convertLegacySection(state.document, selectedNode.id);
        if (!result.converted) {
          message.warning(result.reason || '旧 Section 转换失败');
          return;
        }
        replaceDocument(result.document);
        dispatch({ type: 'select', nodeId: result.nodeId || selectedNode.id });
        if (result.warnings.length > 0) {
          message.warning(`已转换为新结构，并完成 ${result.warnings.length} 项兼容调整，请检查布局后再保存`);
        } else {
          message.success('已转换为 Container → Grid 新结构，请检查后保存草稿');
        }
      },
    });
  }, [selectedNode, state.document]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.key !== 'Delete' && event.key !== 'Backspace') || isEditingText(event.target)) return;
      if (!selectedNode || selectedNode.id === state.document.id) return;
      event.preventDefault();
      handleDelete();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDelete, selectedNode, state.document.id]);

  const handleSave = async () => {
    await onSave?.(state.document);
    dispatch({ type: 'mark-saved' });
    message.success('草稿已保存');
  };

  const handlePublish = async () => {
    if (state.dirty && onSave) await onSave(state.document);
    await onPublish?.(state.document);
    dispatch({ type: 'mark-saved' });
    message.success('页面已发布');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', minHeight: 680 }}>
      <EditorToolbar
        device={state.device}
        dirty={state.dirty}
        saving={saving}
        publishing={publishing}
        onDeviceChange={(device) => dispatch({ type: 'set-device', device })}
        onSave={handleSave}
        onPreview={() => setPreviewOpen(true)}
        onPublish={handlePublish}
      />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <EditorSidebar
          document={state.document}
          selectedNodeId={state.selectedNodeId}
          onSelect={(nodeId) => dispatch({ type: 'select', nodeId })}
          onInsert={handleInsert}
          canInsert={handleCanInsert}
          onDragStart={(source) => dispatch({ type: 'set-dragging', source })}
          onDragEnd={() => dispatch({ type: 'clear-drag' })}
          onMoveNode={handleMoveNode}
        />
        <Canvas
          document={state.document}
          device={state.device}
          selectedNodeId={state.selectedNodeId}
          dragSource={state.dragging}
          onSelect={(nodeId) => dispatch({ type: 'select', nodeId })}
          onDeleteNode={handleDeleteNode}
          onDuplicateNode={handleDuplicateNode}
          onMoveNodeRelative={handleMoveNodeRelative}
          hasStyleClipboard={Boolean(styleClipboard)}
          onCopyNodeStyle={handleCopyNodeStyle}
          onPasteNodeStyle={handlePasteNodeStyle}
          onDragStart={(source) => dispatch({ type: 'set-dragging', source })}
          onDragEnd={() => dispatch({ type: 'clear-drag' })}
          onDropTargetChange={(target) => dispatch({ type: 'set-drop-target', target })}
          canDrop={handleCanDrop}
          onDrop={handleDrop}
        />
        <PropertyPanel
          node={selectedNode}
          device={state.device}
          onPropsChange={handlePropsChange}
          onStyleChange={handleStyleChange}
          onDelete={handleDelete}
          onConvertLegacySection={selectedNode?.type === 'wb.section' ? handleConvertLegacySection : undefined}
        />
      </div>
      <Modal
        open={previewOpen}
        title="页面预览"
        width="90vw"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        destroyOnClose
      >
        <div style={{ minHeight: 600, overflow: 'auto' }}>
          <WebsiteRenderer schema={state.document} device={state.device} />
        </div>
      </Modal>
    </div>
  );
}
