import React from 'react';
import { Button, Divider, Input, InputNumber, Select, Space, Typography } from 'antd';
import type { DeviceType, WebsiteNode, WebsiteStyle } from '../../../shared/schema';

export interface PropertyPanelProps {
  node?: WebsiteNode;
  device: DeviceType;
  onPropsChange: (patch: Record<string, unknown>) => void;
  onStyleChange: (patch: Partial<WebsiteStyle>) => void;
  onDelete: () => void;
}

function textValue(value: unknown) {
  return value == null ? '' : String(value);
}

export function PropertyPanel({ node, device, onPropsChange, onStyleChange, onDelete }: PropertyPanelProps) {
  if (!node) return <div style={{ width: 300, padding: 16 }}>请选择组件</div>;
  const style = node.responsive?.[device] || {};
  const typography = style.typography || {};
  const spacing = style.spacing || {};
  const layout = style.layout || {};

  return (
    <div style={{ width: 300, padding: 16, overflow: 'auto', borderLeft: '1px solid #eee' }}>
      <Typography.Title level={5}>属性</Typography.Title>
      <Typography.Text type="secondary">{node.type} / {device}</Typography.Text>
      <Divider />
      {(node.type === 'wb.heading' || node.type === 'wb.text' || node.type === 'wb.button') && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <span>文字</span>
          <Input value={textValue(node.props.text)} onChange={(e) => onPropsChange({ text: e.target.value })} />
        </Space>
      )}
      {node.type === 'wb.heading' && (
        <Space direction="vertical" style={{ width: '100%', marginTop: 12 }}>
          <span>标题级别</span>
          <InputNumber min={1} max={6} value={Number(node.props.level || 2)} onChange={(value) => onPropsChange({ level: value || 2 })} />
        </Space>
      )}
      {node.type === 'wb.grid' && (
        <Space direction="vertical" style={{ width: '100%', marginTop: 12 }}>
          <span>列数</span>
          <InputNumber min={1} max={12} value={Number(node.props.columns || 3)} onChange={(value) => onPropsChange({ columns: value || 1 })} />
        </Space>
      )}
      {node.type === 'wb.image' && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <span>图片 URL</span>
          <Input value={textValue(node.props.src)} onChange={(e) => onPropsChange({ src: e.target.value })} />
          <span>Alt</span>
          <Input value={textValue(node.props.alt)} onChange={(e) => onPropsChange({ alt: e.target.value })} />
        </Space>
      )}
      {node.type === 'wb.button' && (
        <Space direction="vertical" style={{ width: '100%', marginTop: 12 }}>
          <span>链接</span>
          <Input value={textValue(node.props.href)} onChange={(e) => onPropsChange({ href: e.target.value })} />
        </Space>
      )}
      <Divider>布局与样式</Divider>
      <Space direction="vertical" style={{ width: '100%' }}>
        <span>宽度</span>
        <Input value={layout.width || ''} placeholder="100% / 1200px" onChange={(e) => onStyleChange({ layout: { width: e.target.value } })} />
        <span>最大宽度</span>
        <Input value={layout.maxWidth || ''} placeholder="1200px" onChange={(e) => onStyleChange({ layout: { maxWidth: e.target.value } })} />
        <span>显示</span>
        <Select allowClear value={layout.display} style={{ width: '100%' }} options={[{ value: 'block' }, { value: 'flex' }, { value: 'grid' }]} onChange={(value) => onStyleChange({ layout: { display: value } })} />
        <span>上内边距</span>
        <Input value={spacing.paddingTop || ''} placeholder="40px" onChange={(e) => onStyleChange({ spacing: { paddingTop: e.target.value } })} />
        <span>下内边距</span>
        <Input value={spacing.paddingBottom || ''} placeholder="40px" onChange={(e) => onStyleChange({ spacing: { paddingBottom: e.target.value } })} />
        <span>文字颜色</span>
        <Input value={typography.color || ''} placeholder="#333333" onChange={(e) => onStyleChange({ typography: { color: e.target.value } })} />
        <span>字号</span>
        <Input value={typography.fontSize || ''} placeholder="16px" onChange={(e) => onStyleChange({ typography: { fontSize: e.target.value } })} />
        <span>对齐</span>
        <Select allowClear value={typography.textAlign} style={{ width: '100%' }} options={['left','center','right','justify'].map((value) => ({ value }))} onChange={(value) => onStyleChange({ typography: { textAlign: value } })} />
        <span>背景色</span>
        <Input value={style.background?.color || ''} placeholder="#ffffff" onChange={(e) => onStyleChange({ background: { color: e.target.value } })} />
        <span>圆角</span>
        <Input value={style.border?.radius || ''} placeholder="8px" onChange={(e) => onStyleChange({ border: { radius: e.target.value } })} />
      </Space>
      {node.type !== 'wb.page' && <Button danger block style={{ marginTop: 20 }} onClick={onDelete}>删除组件</Button>}
    </div>
  );
}
