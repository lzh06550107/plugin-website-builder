import React from 'react';
import { Tree, Typography } from 'antd';
import type { WebsiteNode } from '../../../shared/schema';
import { findNode, findNodeLocation, getAncestorIds } from '../../../shared/tree';
import { componentRegistry } from '../../registry';
import type { DragSource, DropTarget } from '../dnd';
import { resolveLayerTreeDropTarget, writeDragSource } from '../dnd';

export interface LayerPanelProps {
  document: WebsiteNode;
  selectedNodeId?: string;
  onSelect: (nodeId: string) => void;
  onDragStart?: (source: DragSource) => void;
  onDragEnd?: () => void;
  onMoveNode?: (nodeId: string, target: DropTarget) => void;
}

interface LayerTreeItem {
  key: string;
  title: React.ReactNode;
  children?: LayerTreeItem[];
}

function describeNode(node: WebsiteNode) {
  const definition = componentRegistry.get(node.type);
  const label = definition?.label || node.type;
  const text = typeof node.props.text === 'string' ? node.props.text.trim() : '';
  return text ? `${label} · ${text.slice(0, 24)}` : label;
}

function toTreeItem(node: WebsiteNode): LayerTreeItem {
  return {
    key: node.id,
    title: describeNode(node),
    children: node.children.length ? node.children.map(toTreeItem) : undefined,
  };
}

export function LayerPanel({
  document,
  selectedNodeId,
  onSelect,
  onDragStart,
  onDragEnd,
  onMoveNode,
}: LayerPanelProps) {
  const [expandedKeys, setExpandedKeys] = React.useState<React.Key[]>([document.id]);

  React.useEffect(() => {
    if (!selectedNodeId) return;
    const ancestors = getAncestorIds(document, selectedNodeId);
    setExpandedKeys((current) => Array.from(new Set([...current, ...ancestors])));
  }, [document, selectedNodeId]);

  return (
    <div style={{ padding: '0 8px 12px', overflow: 'auto' }}>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
        页面结构
      </Typography.Text>
      <Tree
        blockNode
        showLine={{ showLeafIcon: false }}
        draggable={{
          icon: false,
          nodeDraggable: (node) => String(node.key) !== document.id,
        }}
        treeData={[toTreeItem(document)]}
        selectedKeys={selectedNodeId ? [selectedNodeId] : []}
        expandedKeys={expandedKeys}
        onExpand={(keys) => setExpandedKeys(keys)}
        onSelect={(keys) => {
          const key = keys[0];
          if (key !== undefined) onSelect(String(key));
        }}
        onDragStart={(info) => {
          const nodeId = String(info.node.key);
          if (nodeId === document.id) return;
          const source: DragSource = { kind: 'node', nodeId };
          writeDragSource(info.event.dataTransfer, source);
          onSelect(nodeId);
          onDragStart?.(source);
        }}
        onDragEnd={() => onDragEnd?.()}
        onDrop={(info) => {
          const nodeId = String(info.dragNode.key);
          if (nodeId === document.id) return;

          const anchorId = String(info.node.key);
          const anchor = findNode(document, anchorId);
          const location = findNodeLocation(document, anchorId);
          if (!anchor || !location) return;

          const positionParts = String(info.node.pos).split('-');
          const anchorPosition = Number(positionParts[positionParts.length - 1]);
          const target = resolveLayerTreeDropTarget({
            anchorNodeId: anchorId,
            parentId: location.parentId,
            index: location.index,
            childCount: anchor.children.length,
            dropToGap: info.dropToGap,
            relativePosition: info.dropPosition - anchorPosition,
          });

          if (target) onMoveNode?.(nodeId, target);
          onDragEnd?.();
        }}
      />
    </div>
  );
}
