import React from 'react';
import { Button, Card, Divider, Space, Typography } from 'antd';
import { componentRegistry } from '../../registry';
import type { DragSource } from '../dnd';
import { writeDragSource } from '../dnd';

export interface ComponentPanelProps {
  onInsert: (type: string) => void;
  canInsert?: (type: string) => boolean;
  onDragStart?: (source: DragSource) => void;
  onDragEnd?: () => void;
}

export function ComponentPanel({ onInsert, canInsert, onDragStart, onDragEnd }: ComponentPanelProps) {
  const definitions = componentRegistry
    .list()
    .filter((item) => item.type !== 'wb.page' && item.type !== 'wb.section');
  const layout = definitions.filter((item) => item.category === 'layout');
  const content = definitions.filter((item) => item.category === 'content');

  const renderGroup = (title: string, items: typeof definitions) => (
    <>
      <Typography.Text strong>{title}</Typography.Text>
      <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
        {items.map((definition) => {
          const source: DragSource = { kind: 'palette', componentType: definition.type };
          const enabled = canInsert ? canInsert(definition.type) : true;
          return (
            <Card key={definition.type} size="small" styles={{ body: { padding: 8 } }}>
              <div
                draggable={enabled}
                onDragStart={(event) => {
                  if (!enabled) {
                    event.preventDefault();
                    return;
                  }
                  writeDragSource(event.dataTransfer, source);
                  onDragStart?.(source);
                }}
                onDragEnd={onDragEnd}
                style={{ cursor: enabled ? 'grab' : 'not-allowed' }}
              >
                <Button block disabled={!enabled} onClick={() => enabled && onInsert(definition.type)}>
                  {definition.label}
                </Button>
              </div>
            </Card>
          );
        })}
      </Space>
    </>
  );

  return (
    <div style={{ padding: '0 12px 12px', overflow: 'auto' }}>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
        结构约束：Page → Container → Grid → 内容
      </Typography.Text>
      {renderGroup('布局', layout)}
      <Divider style={{ margin: '12px 0' }} />
      {renderGroup('内容', content)}
    </div>
  );
}
