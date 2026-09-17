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

function SpacingGrid(props: {
  title: string;
  values: { top?: string; right?: string; bottom?: string; left?: string };
  onChange: (side: 'top' | 'right' | 'bottom' | 'left', value: string) => void;
}) {
  const labels: Array<['top' | 'right' | 'bottom' | 'left', string]> = [
    ['top', '上'],
    ['right', '右'],
    ['bottom', '下'],
    ['left', '左'],
  ];
  return (
    <div style={{ width: '100%' }}>
      <Typography.Text>{props.title}</Typography.Text>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
        {labels.map(([side, label]) => (
          <div key={side}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{label}</Typography.Text>
            <Input
              value={props.values[side] || ''}
              placeholder="0 / 16px"
              onChange={(event) => props.onChange(side, event.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PropertyPanel({ node, device, onPropsChange, onStyleChange, onDelete }: PropertyPanelProps) {
  if (!node) return <div style={{ width: 320, padding: 16 }}>请选择组件</div>;
  const style = node.responsive?.[device] || {};
  const typography = style.typography || {};
  const spacing = style.spacing || {};
  const layout = style.layout || {};
  const isFlex = layout.display === 'flex';
  const isGrid = layout.display === 'grid' || node.type === 'wb.grid';

  return (
    <div style={{ width: 320, flex: '0 0 320px', padding: 16, overflow: 'auto', borderLeft: '1px solid #eee' }}>
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

      <Divider>尺寸与布局</Divider>
      <Space direction="vertical" style={{ width: '100%' }} size={10}>
        <span>宽度</span>
        <Input value={layout.width || ''} placeholder="100% / 1200px" onChange={(e) => onStyleChange({ layout: { width: e.target.value } })} />
        <span>最大宽度</span>
        <Input value={layout.maxWidth || ''} placeholder="1200px" onChange={(e) => onStyleChange({ layout: { maxWidth: e.target.value } })} />
        <span>最小高度</span>
        <Input value={layout.minHeight || ''} placeholder="160px / 100vh" onChange={(e) => onStyleChange({ layout: { minHeight: e.target.value } })} />
        <span>显示模式</span>
        <Select
          allowClear
          value={layout.display}
          style={{ width: '100%' }}
          options={[
            { value: 'block', label: 'Block' },
            { value: 'flex', label: 'Flex' },
            { value: 'grid', label: 'Grid' },
          ]}
          onChange={(value) => onStyleChange({ layout: { display: value } })}
        />

        {isFlex && (
          <>
            <span>Flex 方向</span>
            <Select
              allowClear
              value={layout.flexDirection}
              style={{ width: '100%' }}
              options={['row', 'column', 'row-reverse', 'column-reverse'].map((value) => ({ value, label: value }))}
              onChange={(value) => onStyleChange({ layout: { flexDirection: value } })}
            />
            <span>主轴对齐</span>
            <Select
              allowClear
              value={layout.justifyContent}
              style={{ width: '100%' }}
              options={['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'].map((value) => ({ value, label: value }))}
              onChange={(value) => onStyleChange({ layout: { justifyContent: value } })}
            />
            <span>交叉轴对齐</span>
            <Select
              allowClear
              value={layout.alignItems}
              style={{ width: '100%' }}
              options={['stretch', 'flex-start', 'center', 'flex-end'].map((value) => ({ value, label: value }))}
              onChange={(value) => onStyleChange({ layout: { alignItems: value } })}
            />
          </>
        )}

        {isGrid && node.type !== 'wb.grid' && (
          <>
            <span>Grid 列模板</span>
            <Input
              value={layout.gridTemplateColumns || ''}
              placeholder="repeat(3, 1fr)"
              onChange={(e) => onStyleChange({ layout: { gridTemplateColumns: e.target.value } })}
            />
          </>
        )}

        {(isFlex || isGrid) && (
          <>
            <span>子项间距 Gap</span>
            <Input value={layout.gap || ''} placeholder="16px" onChange={(e) => onStyleChange({ layout: { gap: e.target.value } })} />
          </>
        )}
      </Space>

      <Divider>间距</Divider>
      <Space direction="vertical" style={{ width: '100%' }} size={14}>
        <SpacingGrid
          title="内边距 Padding"
          values={{
            top: spacing.paddingTop,
            right: spacing.paddingRight,
            bottom: spacing.paddingBottom,
            left: spacing.paddingLeft,
          }}
          onChange={(side, value) => {
            const key = `padding${side[0].toUpperCase()}${side.slice(1)}` as keyof NonNullable<WebsiteStyle['spacing']>;
            onStyleChange({ spacing: { [key]: value } });
          }}
        />
        <SpacingGrid
          title="外边距 Margin"
          values={{
            top: spacing.marginTop,
            right: spacing.marginRight,
            bottom: spacing.marginBottom,
            left: spacing.marginLeft,
          }}
          onChange={(side, value) => {
            const key = `margin${side[0].toUpperCase()}${side.slice(1)}` as keyof NonNullable<WebsiteStyle['spacing']>;
            onStyleChange({ spacing: { [key]: value } });
          }}
        />
      </Space>

      <Divider>文字与外观</Divider>
      <Space direction="vertical" style={{ width: '100%' }} size={10}>
        <span>文字颜色</span>
        <Input value={typography.color || ''} placeholder="#333333" onChange={(e) => onStyleChange({ typography: { color: e.target.value } })} />
        <span>字号</span>
        <Input value={typography.fontSize || ''} placeholder="16px" onChange={(e) => onStyleChange({ typography: { fontSize: e.target.value } })} />
        <span>文字对齐</span>
        <Select
          allowClear
          value={typography.textAlign}
          style={{ width: '100%' }}
          options={['left', 'center', 'right', 'justify'].map((value) => ({ value, label: value }))}
          onChange={(value) => onStyleChange({ typography: { textAlign: value } })}
        />
        <span>背景色</span>
        <Input value={style.background?.color || ''} placeholder="#ffffff" onChange={(e) => onStyleChange({ background: { color: e.target.value } })} />
        <span>圆角</span>
        <Input value={style.border?.radius || ''} placeholder="8px" onChange={(e) => onStyleChange({ border: { radius: e.target.value } })} />
      </Space>

      {node.type !== 'wb.page' && (
        <Button danger block style={{ marginTop: 20 }} onClick={onDelete}>删除组件</Button>
      )}
    </div>
  );
}
