import { useAPIClient } from '@nocobase/client';
import React, { useEffect, useMemo, useState } from 'react';
import type { WebsiteDevice, WebsiteNodeType, WebsitePageSchema } from '../../shared/schema';
import { findNode } from '../../shared/utils';
import { useT } from '../locale';
import { websiteComponentRegistry } from '../registry';
import { WebsiteRenderer } from '../renderer';
import { publishPage, savePageDraft } from '../services/websiteBuilderApi';
import { ComponentPalette, LayerTree, PropertyPanel } from './components';
import { addComponent } from './editorState';

export interface WebsiteEditorProps {
  pageId: string | number;
  initialSchema: WebsitePageSchema;
  onSaved?: (schema: WebsitePageSchema) => void;
  onPublished?: () => void;
}

const toolbarButton: React.CSSProperties = {
  border: '1px solid #d9d9d9', background: '#fff', borderRadius: 6, padding: '7px 12px', cursor: 'pointer',
};

export function WebsiteEditor({ pageId, initialSchema, onSaved, onPublished }: WebsiteEditorProps) {
  const api = useAPIClient();
  const t = useT();
  const [schema, setSchema] = useState<WebsitePageSchema>(initialSchema);
  const [selectedId, setSelectedId] = useState(initialSchema.root.id);
  const [device, setDevice] = useState<WebsiteDevice>('desktop');
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    setSchema(initialSchema);
    setSelectedId(initialSchema.root.id);
    setStatus('');
  }, [pageId, initialSchema]);

  const selectedDefinition = useMemo(() => {
    const node = findNode(schema.root, selectedId);
    return node ? websiteComponentRegistry.get(node.type) : undefined;
  }, [schema, selectedId]);

  const handleAdd = (type: WebsiteNodeType) => {
    const parentId = selectedDefinition?.canHaveChildren ? selectedId : schema.root.id;
    const id = `${type.replace('wb.', '')}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setSchema((current) => addComponent(current, parentId, type, id));
    setSelectedId(id);
  };

  const handleSave = async () => {
    setStatus(t('Saving...'));
    try {
      await savePageDraft(api, pageId, schema);
      setStatus(t('Draft saved'));
      onSaved?.(schema);
    } catch (error: any) {
      setStatus(`${t('Save failed')}: ${error?.message || error}`);
    }
  };

  const handlePublish = async () => {
    setStatus(t('Publishing...'));
    try {
      await savePageDraft(api, pageId, schema);
      await publishPage(api, pageId);
      setStatus(t('Published'));
      onSaved?.(schema);
      onPublished?.();
    } catch (error: any) {
      setStatus(`${t('Publish failed')}: ${error?.message || error}`);
    }
  };

  const canvasWidth = device === 'mobile' ? 390 : '100%';

  return (
    <div style={{ height: 'calc(100vh - 120px)', minHeight: 620, display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      <div style={{ height: 50, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: '#fff', borderBottom: '1px solid #eee' }}>
        <button type="button" style={{ ...toolbarButton, background: device === 'desktop' ? '#e6f4ff' : '#fff' }} onClick={() => setDevice('desktop')}>
          {t('Desktop')}
        </button>
        <button type="button" style={{ ...toolbarButton, background: device === 'mobile' ? '#e6f4ff' : '#fff' }} onClick={() => setDevice('mobile')}>
          {t('Mobile')}
        </button>
        <span style={{ flex: 1, color: '#888', fontSize: 12 }}>{status}</span>
        <button type="button" style={toolbarButton} onClick={() => setPreview(true)}>{t('Preview')}</button>
        <button type="button" style={toolbarButton} onClick={handleSave}>{t('Save draft')}</button>
        <button type="button" style={{ ...toolbarButton, background: '#1677ff', color: '#fff', borderColor: '#1677ff' }} onClick={handlePublish}>
          {t('Publish')}
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '240px minmax(0, 1fr) 310px' }}>
        <div style={{ borderRight: '1px solid #eee', overflow: 'auto', background: '#fff' }}>
          <ComponentPalette onAdd={handleAdd} t={t} />
          <LayerTree schema={schema} selectedId={selectedId} onSelect={setSelectedId} t={t} />
        </div>

        <div style={{ overflow: 'auto', padding: 24 }} onClick={() => setSelectedId(schema.root.id)}>
          <div style={{ width: canvasWidth, minHeight: 500, margin: '0 auto', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,.08)' }}>
            <WebsiteRenderer schema={schema} device={device} selectedNodeId={selectedId} onSelect={setSelectedId} />
          </div>
        </div>

        <div style={{ borderLeft: '1px solid #eee', overflow: 'auto', background: '#fff' }}>
          <PropertyPanel schema={schema} setSchema={setSchema} selectedId={selectedId} device={device} t={t} />
        </div>
      </div>

      {preview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,.55)', padding: 24 }}>
          <div style={{ height: '100%', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 10, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
              <strong>{t('Draft preview')}</strong>
              <button type="button" style={toolbarButton} onClick={() => setPreview(false)}>{t('Close')}</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 24, background: '#f5f5f5' }}>
              <div style={{ width: canvasWidth, margin: '0 auto', background: '#fff' }}>
                <WebsiteRenderer schema={schema} device={device} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
