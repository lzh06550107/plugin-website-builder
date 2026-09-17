import React from 'react';
import { Tree, Typography } from 'antd';
import type { WebsiteNode } from '../../../shared/schema';
import { getAncestorIds } from '../../../shared/tree';
import { componentRegistry } from '../../registry';

export interface LayerPanelProps {
  document: WebsiteNode;
  selectedNodeId?: string;
  onSelect: (nodeId: string) => void;
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

export function LayerPanel({ document, selectedNodeId, onSelect }: LayerPanelProps) {
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
        treeData={[toTreeItem(document)]}
        selectedKeys={selectedNodeId ? [selectedNodeId] : []}
        expandedKeys={expandedKeys}
        onExpand={(keys) => setExpandedKeys(keys)}
        onSelect={(keys) => {
          const key = keys[0];
          if (key !== undefined) onSelect(String(key));
        }}
      />
    </div>
  );
}
