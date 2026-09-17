import React from 'react';
import { Button, Card, Divider, Space, Typography } from 'antd';
import { componentRegistry } from '../../registry';

export interface ComponentPanelProps {
  onInsert: (type: string) => void;
}

export function ComponentPanel({ onInsert }: ComponentPanelProps) {
  const definitions = componentRegistry.list().filter((item) => item.type !== 'wb.page');
  const layout = definitions.filter((item) => item.category === 'layout');
  const content = definitions.filter((item) => item.category === 'content');

  const renderGroup = (title: string, items: typeof definitions) => (
    <>
      <Typography.Text strong>{title}</Typography.Text>
      <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
        {items.map((definition) => (
          <Card key={definition.type} size="small" styles={{ body: { padding: 8 } }}>
            <Button block onClick={() => onInsert(definition.type)}>
              {definition.label}
            </Button>
          </Card>
        ))}
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
