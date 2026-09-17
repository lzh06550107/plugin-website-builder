import React from 'react';
import { Button, Card, Space, Typography } from 'antd';
import { componentRegistry } from '../../registry';

export interface ComponentPanelProps {
  onInsert: (type: string) => void;
}

export function ComponentPanel({ onInsert }: ComponentPanelProps) {
  const definitions = componentRegistry.list().filter((item) => item.type !== 'wb.page');
  return (
    <div style={{ width: 220, padding: 12, overflow: 'auto', borderRight: '1px solid #eee' }}>
      <Typography.Title level={5}>组件</Typography.Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        {definitions.map((definition) => (
          <Card key={definition.type} size="small" styles={{ body: { padding: 8 } }}>
            <Button block onClick={() => onInsert(definition.type)}>
              {definition.label}
            </Button>
          </Card>
        ))}
      </Space>
    </div>
  );
}
