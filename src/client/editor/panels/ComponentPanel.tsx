import React from 'react';
import { Button, Card, Divider, Space, Typography } from 'antd';
import { componentRegistry } from '../../registry';
import type { DragSource } from '../dnd';
import { writeDragSource } from '../dnd';

export interface ComponentPanelProps {
  onInsert: (type: string) => void;
  onDragStart?: (source: DragSource) => void;
  onDragEnd?: () => void;
}

export function ComponentPanel({ onInsert, onDragStart, onDragEnd }: ComponentPanelProps) {
  const definitions = componentRegistry.list().filter((item) => item.type !== 'wb.page');
  const layout = definitions.filter((item) => item.category === 'layout');
  const content = definitions.filter((item) => item.category === 'content');

  const renderGroup = (title: string, items: typeof definitions) => (
    <>
      <Typography.Text strong>{title}</Typography.Text>
      <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
        {items.map((definition) => {
          const source: DragSource = { kind: 'palette', componentType: definition.type };
          return (
            <Card key={definition.type} size="small" styles={{ body: { padding: 8 } }}>
              <div
                draggable
                onDragStart={(event) => {
                  writeDragSource(event.dataTransfer, source);
                  onDragStart?.(source);
                }}
                onDragEnd={onDragEnd}
                style={{ cursor: 'grab' }}
              >
                <Button block onClick={() => onInsert(definition.type)}>
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
      {renderGroup('布局', layout)}
      <Divider style={{ margin: '12px 0' }} />
      {renderGroup('内容', content)}
    </div>
  );
}
