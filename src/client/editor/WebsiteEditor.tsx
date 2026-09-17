import React, { useMemo, useReducer } from 'react';
import { message, Modal } from 'antd';
import type { WebsiteNode, WebsiteStyle } from '../../shared/schema';
import { createNode } from '../../shared/schema';
import { findNode } from '../../shared/tree';
import { componentRegistry } from '../registry';
import { WebsiteRenderer } from '../renderer';
import { Canvas } from './canvas/Canvas';
import { insertChild, removeEditorNode, updateNodeProps, updateNodeStyle } from './commands';
import { ComponentPanel } from './panels/ComponentPanel';
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

export function WebsiteEditor({ initialDocument, saving, publishing, onSave, onPublish }: WebsiteEditorProps) {
  const [state, dispatch] = useReducer(editorReducer, initialDocument, createEditorState);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const selectedNode = useMemo(() => state.selectedNodeId ? findNode(state.document, state.selectedNodeId) : undefined, [state.document, state.selectedNodeId]);

  const replaceDocument = (document: WebsiteNode) => dispatch({ type: 'replace-document', document, markDirty: true });

  const handleInsert = (type: string) => {
    const definition = componentRegistry.get(selectedNode?.type || '');
    const parentId = selectedNode && definition?.acceptsChildren ? selectedNode.id : state.document.id;
    const node = createNode(type, nextNodeId(type));
    replaceDocument(insertChild(state.document, parentId, node));
    dispatch({ type: 'select', nodeId: node.id });
  };

  const handlePropsChange = (patch: Record<string, unknown>) => {
    if (!selectedNode) return;
    replaceDocument(updateNodeProps(state.document, selectedNode.id, patch));
  };

  const handleStyleChange = (patch: Partial<WebsiteStyle>) => {
    if (!selectedNode) return;
    replaceDocument(updateNodeStyle(state.document, selectedNode.id, state.device, patch));
  };

  const handleDelete = () => {
    if (!selectedNode || selectedNode.id === state.document.id) return;
    replaceDocument(removeEditorNode(state.document, selectedNode.id));
    dispatch({ type: 'select', nodeId: state.document.id });
  };

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
      <EditorToolbar device={state.device} dirty={state.dirty} saving={saving} publishing={publishing} onDeviceChange={(device) => dispatch({ type: 'set-device', device })} onSave={handleSave} onPreview={() => setPreviewOpen(true)} onPublish={handlePublish} />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <ComponentPanel onInsert={handleInsert} />
        <Canvas document={state.document} device={state.device} selectedNodeId={state.selectedNodeId} onSelect={(nodeId) => dispatch({ type: 'select', nodeId })} />
        <PropertyPanel node={selectedNode} device={state.device} onPropsChange={handlePropsChange} onStyleChange={handleStyleChange} onDelete={handleDelete} />
      </div>
      <Modal open={previewOpen} title="页面预览" width="90vw" footer={null} onCancel={() => setPreviewOpen(false)} destroyOnClose>
        <div style={{ minHeight: 600, overflow: 'auto' }}><WebsiteRenderer schema={state.document} device={state.device} /></div>
      </Modal>
    </div>
  );
}
