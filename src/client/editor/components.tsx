import React from 'react';
import type { WebsiteDevice, WebsiteNode, WebsiteNodeType, WebsitePageSchema } from '../../shared/schema';
import { findNode } from '../../shared/utils';
import { websiteComponentRegistry } from '../registry';
import { removeComponent, updateNodeProps, updateNodeStyleField, type WebsiteStyleGroup } from './editorState';

const panelStyle: React.CSSProperties = { padding: 12, overflow: 'auto', background: '#fff' };
const buttonStyle: React.CSSProperties = {
  border: '1px solid #d9d9d9', background: '#fff', borderRadius: 6, padding: '6px 10px', cursor: 'pointer',
};

export function ComponentPalette({ onAdd, t }: { onAdd: (type: WebsiteNodeType) => void; t: (value: string) => string }) {
  const definitions = websiteComponentRegistry.list().filter((item) => item.type !== 'wb.page');
  return (
    <div style={panelStyle}>
      <strong>{t('Components')}</strong>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
        {definitions.map((item) => (
          <button key={item.type} type="button" style={buttonStyle} onClick={() => onAdd(item.type)}>
            {t(item.label)}
          </button>
        ))}
      </div>
    </div>
  );
}

function LayerNode({ node, selectedId, onSelect, depth = 0 }: {
  node: WebsiteNode; selectedId?: string; onSelect: (id: string) => void; depth?: number;
}) {
  const definition = websiteComponentRegistry.get(node.type);
  return (
    <>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        style={{
          display: 'block', width: '100%', textAlign: 'left', padding: '5px 8px', paddingLeft: 8 + depth * 14,
          border: 0, borderRadius: 4, cursor: 'pointer',
          background: selectedId === node.id ? '#e6f4ff' : 'transparent',
        }}
      >
        {definition?.label || node.type}
      </button>
      {node.children.map((child) => (
        <LayerNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
      ))}
    </>
  );
}

export function LayerTree({ schema, selectedId, onSelect, t }: {
  schema: WebsitePageSchema; selectedId?: string; onSelect: (id: string) => void; t: (value: string) => string;
}) {
  return (
    <div style={{ ...panelStyle, borderTop: '1px solid #f0f0f0' }}>
      <strong>{t('Layers')}</strong>
      <div style={{ marginTop: 8 }}>
        <LayerNode node={schema.root} selectedId={selectedId} onSelect={onSelect} />
      </div>
    </div>
  );
}

type FieldDescriptor = { group: WebsiteStyleGroup; key: string; label: string; type?: 'text' | 'color' };
const styleFields: FieldDescriptor[] = [
  { group: 'layout', key: 'width', label: 'Width' },
  { group: 'layout', key: 'maxWidth', label: 'Max width' },
  { group: 'layout', key: 'minHeight', label: 'Min height' },
  { group: 'layout', key: 'display', label: 'Display' },
  { group: 'layout', key: 'flexDirection', label: 'Flex direction' },
  { group: 'layout', key: 'alignItems', label: 'Align items' },
  { group: 'layout', key: 'justifyContent', label: 'Justify content' },
  { group: 'layout', key: 'gridTemplateColumns', label: 'Grid columns' },
  { group: 'layout', key: 'gap', label: 'Gap' },
  { group: 'spacing', key: 'marginTop', label: 'Margin top' },
  { group: 'spacing', key: 'marginRight', label: 'Margin right' },
  { group: 'spacing', key: 'marginBottom', label: 'Margin bottom' },
  { group: 'spacing', key: 'marginLeft', label: 'Margin left' },
  { group: 'spacing', key: 'paddingTop', label: 'Padding top' },
  { group: 'spacing', key: 'paddingRight', label: 'Padding right' },
  { group: 'spacing', key: 'paddingBottom', label: 'Padding bottom' },
  { group: 'spacing', key: 'paddingLeft', label: 'Padding left' },
  { group: 'typography', key: 'color', label: 'Text color' },
  { group: 'typography', key: 'fontSize', label: 'Font size' },
  { group: 'typography', key: 'fontWeight', label: 'Font weight' },
  { group: 'typography', key: 'lineHeight', label: 'Line height' },
  { group: 'typography', key: 'textAlign', label: 'Text align' },
  { group: 'background', key: 'color', label: 'Background color' },
  { group: 'background', key: 'image', label: 'Background image' },
  { group: 'border', key: 'width', label: 'Border width' },
  { group: 'border', key: 'style', label: 'Border style' },
  { group: 'border', key: 'color', label: 'Border color' },
  { group: 'border', key: 'radius', label: 'Border radius' },
];

function valueFor(node: WebsiteNode, device: WebsiteDevice, group: WebsiteStyleGroup, key: string) {
  const source: any = device === 'desktop' ? node.style : node.responsive?.mobile;
  return source?.[group]?.[key] ?? '';
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: '#666', marginBottom: 3 };
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '6px 8px', border: '1px solid #d9d9d9', borderRadius: 5 };

function InputRow({ label, value, onChange }: { label: string; value: any; onChange: (value: string) => void }) {
  return (
    <label style={{ display: 'block', marginBottom: 9 }}>
      <span style={labelStyle}>{label}</span>
      <input type="text" value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} style={inputStyle} />
    </label>
  );
}

export function PropertyPanel({ schema, setSchema, selectedId, device, t }: {
  schema: WebsitePageSchema;
  setSchema: React.Dispatch<React.SetStateAction<WebsitePageSchema>>;
  selectedId?: string;
  device: WebsiteDevice;
  t: (value: string) => string;
}) {
  const node = selectedId ? findNode(schema.root, selectedId) : undefined;
  if (!node) return <div style={panelStyle}>{t('Select a component')}</div>;

  const updateProps = (patch: Record<string, unknown>) => setSchema((current) => updateNodeProps(current, node.id, patch));
  const updateStyle = (group: WebsiteStyleGroup, key: string, value: string) =>
    setSchema((current) => updateNodeStyleField(current, node.id, device, group, key, value));

  return (
    <div style={panelStyle}>
      <strong>{t('Properties')}</strong>
      <div style={{ margin: '8px 0 14px', fontSize: 12, color: '#888' }}>{node.type} · {node.id}</div>

      {(node.type === 'wb.heading' || node.type === 'wb.text' || node.type === 'wb.button') && (
        <InputRow label={t('Text')} value={node.props.text} onChange={(value) => updateProps({ text: value })} />
      )}
      {node.type === 'wb.heading' && (
        <InputRow label={t('Heading level')} value={node.props.level} onChange={(value) => updateProps({ level: Number(value) || 2 })} />
      )}
      {node.type === 'wb.image' && (
        <>
          <InputRow label={t('Image URL')} value={node.props.src} onChange={(value) => updateProps({ src: value })} />
          <InputRow label={t('Alt text')} value={node.props.alt} onChange={(value) => updateProps({ alt: value })} />
        </>
      )}
      {node.type === 'wb.button' && (
        <InputRow label={t('Link')} value={node.props.href} onChange={(value) => updateProps({ href: value })} />
      )}

      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, marginTop: 12 }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
          {device === 'desktop' ? t('Desktop base styles') : t('Mobile overrides (empty = inherit)')}
        </div>
        {styleFields.map((field) => (
          <InputRow
            key={`${field.group}.${field.key}`}
            label={t(field.label)}
            value={valueFor(node, device, field.group, field.key)}
            onChange={(value) => updateStyle(field.group, field.key, value)}
          />
        ))}
      </div>

      {node.id !== schema.root.id && (
        <button
          type="button"
          style={{ ...buttonStyle, width: '100%', color: '#cf1322', borderColor: '#ffccc7', marginTop: 8 }}
          onClick={() => setSchema((current) => removeComponent(current, node.id))}
        >
          {t('Delete component')}
        </button>
      )}
    </div>
  );
}
