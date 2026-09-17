import React from 'react';
import { Tabs } from 'antd';
import type { WebsiteNode } from '../../../shared/schema';
import { ComponentPanel } from './ComponentPanel';
import { LayerPanel } from './LayerPanel';

export interface EditorSidebarProps {
  document: WebsiteNode;
  selectedNodeId?: string;
  onSelect: (nodeId: string) => void;
  onInsert: (type: string) => void;
}

export function EditorSidebar(props: EditorSidebarProps) {
  return (
    <div style={{ width: 240, flex: '0 0 240px', overflow: 'hidden', borderRight: '1px solid #eee', background: '#fff' }}>
      <Tabs
        defaultActiveKey="components"
        size="small"
        tabBarStyle={{ padding: '0 12px', marginBottom: 8 }}
        items={[
          {
            key: 'components',
            label: '组件',
            children: <ComponentPanel onInsert={props.onInsert} />,
          },
          {
            key: 'layers',
            label: '图层',
            children: (
              <LayerPanel
                document={props.document}
                selectedNodeId={props.selectedNodeId}
                onSelect={props.onSelect}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
