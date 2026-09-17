import React from 'react';
import type { DeviceType, WebsiteNode } from '../../../shared/schema';
import { WebsiteRenderer } from '../../renderer';

export interface CanvasProps {
  document: WebsiteNode;
  device: DeviceType;
  selectedNodeId?: string;
  onSelect: (nodeId: string) => void;
}

export function Canvas({ document, device, selectedNodeId, onSelect }: CanvasProps) {
  const width = device === 'mobile' ? 390 : '100%';
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 24, background: '#f5f5f5' }} onClick={() => onSelect(document.id)}>
      <div style={{ width, minHeight: 640, margin: '0 auto', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }}>
        <WebsiteRenderer schema={document} device={device} selectedNodeId={selectedNodeId} onSelect={onSelect} />
      </div>
    </div>
  );
}
