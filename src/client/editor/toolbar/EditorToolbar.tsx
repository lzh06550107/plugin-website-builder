import React from 'react';
import { Button, Segmented, Space } from 'antd';
import type { DeviceType } from '../../../shared/schema';

export interface EditorToolbarProps {
  device: DeviceType;
  dirty?: boolean;
  saving?: boolean;
  publishing?: boolean;
  onDeviceChange: (device: DeviceType) => void;
  onSave?: () => void;
  onPreview?: () => void;
  onPublish?: () => void;
}

export function EditorToolbar(props: EditorToolbarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #eee' }}>
      <Space>
        <strong>Website Builder</strong>
        {props.dirty ? <span>未保存</span> : <span>已保存</span>}
      </Space>
      <Space>
        <Segmented
          value={props.device}
          options={[{ label: 'Desktop', value: 'desktop' }, { label: 'Mobile', value: 'mobile' }]}
          onChange={(value) => props.onDeviceChange(value as DeviceType)}
        />
        <Button onClick={props.onPreview}>预览</Button>
        <Button onClick={props.onSave} loading={props.saving}>保存草稿</Button>
        <Button type="primary" onClick={props.onPublish} loading={props.publishing}>发布</Button>
      </Space>
    </div>
  );
}
