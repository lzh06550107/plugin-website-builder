import React from 'react';
import { Button, Space, Typography } from 'antd';
import type { DeviceType, WebsiteNode } from '../../../shared/schema';
import { findNode, findNodeLocation, getNodePath } from '../../../shared/tree';
import { componentRegistry } from '../../registry';
import { WebsiteRenderer } from '../../renderer';
import type { DragSource, DropTarget } from '../dnd';
import { readDragSource, resolveDropTarget, writeDragSource } from '../dnd';

export interface CanvasProps {
  document: WebsiteNode;
  device: DeviceType;
  selectedNodeId?: string;
  dragSource?: DragSource;
  onSelect: (nodeId: string) => void;
  onDeleteSelected?: () => void;
  onDragStart?: (source: DragSource) => void;
  onDragEnd?: () => void;
  onDropTargetChange?: (target?: DropTarget) => void;
  canDrop?: (source: DragSource, target: DropTarget) => boolean;
  onDrop?: (source: DragSource, target: DropTarget) => void;
}

interface DropIndicator {
  left: number;
  top: number;
  width: number;
  height: number;
  valid: boolean;
  inside: boolean;
}

interface HoverOutline {
  nodeId: string;
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

function closestNodeElement(target: EventTarget | null): HTMLElement | undefined {
  if (!(target instanceof Element)) return undefined;
  return target.closest<HTMLElement>('[data-wb-node-id]') || undefined;
}

function findNodeElement(root: HTMLElement, nodeId: string) {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-wb-node-id]')).find(
    (element) => element.dataset.wbNodeId === nodeId,
  );
}

function describeNode(node: WebsiteNode) {
  const label = componentRegistry.get(node.type)?.label || node.type;
  const text = typeof node.props.text === 'string' ? node.props.text.trim() : '';
  return text ? `${label} · ${text.slice(0, 18)}` : label;
}

export function Canvas(props: CanvasProps) {
  const { document, device, selectedNodeId, onSelect } = props;
  const width = device === 'mobile' ? 390 : '100%';
  const frameRef = React.useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = React.useState<DropIndicator>();
  const [hoverOutline, setHoverOutline] = React.useState<HoverOutline>();
  const selectionPath = React.useMemo(
    () => getNodePath(document, selectedNodeId || document.id),
    [document, selectedNodeId],
  );

  React.useEffect(() => {
    if (!selectedNodeId || selectedNodeId === document.id) return;
    const frame = frameRef.current;
    if (!frame) return;
    const element = findNodeElement(frame, selectedNodeId);
    element?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [selectedNodeId, document.id]);

  const resolveEventTarget = React.useCallback((event: React.DragEvent) => {
    const element = closestNodeElement(event.target);
    if (!element) return undefined;
    const nodeId = element.dataset.wbNodeId;
    if (!nodeId) return undefined;
    const node = findNode(document, nodeId);
    const location = findNodeLocation(document, nodeId);
    const definition = node ? componentRegistry.get(node.type) : undefined;
    if (!node || !location || !definition) return undefined;

    const rect = element.getBoundingClientRect();
    const pointerRatio = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5;
    const target = resolveDropTarget({
      nodeId,
      parentId: location.parentId,
      index: location.index,
      childCount: node.children.length,
      acceptsChildren: definition.acceptsChildren,
      pointerRatio,
    });
    if (!target) return undefined;
    return { element, target };
  }, [document]);

  const updateIndicator = React.useCallback((element: HTMLElement, target: DropTarget, valid: boolean) => {
    const frame = frameRef.current;
    if (!frame) return;
    const frameRect = frame.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    const left = rect.left - frameRect.left;
    const widthPx = rect.width;

    if (target.position === 'inside') {
      setIndicator({
        left,
        top: rect.top - frameRect.top,
        width: widthPx,
        height: rect.height,
        valid,
        inside: true,
      });
      return;
    }

    setIndicator({
      left,
      top: (target.position === 'before' ? rect.top : rect.bottom) - frameRect.top - 1,
      width: widthPx,
      height: 3,
      valid,
      inside: false,
    });
  }, []);

  const updateHoverOutline = React.useCallback((event: React.MouseEvent) => {
    if (props.dragSource) {
      setHoverOutline(undefined);
      return;
    }
    const frame = frameRef.current;
    const element = closestNodeElement(event.target);
    if (!frame || !element) {
      setHoverOutline(undefined);
      return;
    }
    const nodeId = element.dataset.wbNodeId;
    const node = nodeId ? findNode(document, nodeId) : undefined;
    if (!node || node.id === document.id) {
      setHoverOutline(undefined);
      return;
    }

    const frameRect = frame.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    setHoverOutline({
      nodeId: node.id,
      label: describeNode(node),
      left: rect.left - frameRect.left,
      top: rect.top - frameRect.top,
      width: rect.width,
      height: rect.height,
    });
  }, [document, props.dragSource]);

  const clearDragChrome = React.useCallback(() => {
    setIndicator(undefined);
    props.onDropTargetChange?.(undefined);
  }, [props.onDropTargetChange]);

  const selectedIsRoot = !selectedNodeId || selectedNodeId === document.id;

  return (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      <div
        data-wb-selection-breadcrumb
        style={{
          minHeight: 42,
          padding: '6px 12px',
          background: '#fff',
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Space size={2} wrap>
          <Typography.Text type="secondary" style={{ fontSize: 12, marginRight: 4 }}>
            当前：
          </Typography.Text>
          {selectionPath.map((node, index) => (
            <React.Fragment key={node.id}>
              {index > 0 && <Typography.Text type="secondary">›</Typography.Text>}
              <Button
                type={node.id === selectedNodeId ? 'primary' : 'link'}
                size="small"
                style={node.id === selectedNodeId ? undefined : { paddingInline: 4 }}
                onClick={() => onSelect(node.id)}
              >
                {describeNode(node)}
              </Button>
            </React.Fragment>
          ))}
        </Space>
        {!selectedIsRoot && props.onDeleteSelected && (
          <Button danger size="small" onClick={props.onDeleteSelected}>
            删除当前组件
          </Button>
        )}
      </div>

      <div
        style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 24, background: '#f5f5f5' }}
        onClick={() => onSelect(document.id)}
      >
        <div
          ref={frameRef}
          style={{
            position: 'relative',
            width,
            minHeight: 640,
            margin: '0 auto',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,.12)',
          }}
          onMouseMove={updateHoverOutline}
          onMouseLeave={() => setHoverOutline(undefined)}
          onDragStart={(event) => {
            setHoverOutline(undefined);
            const element = closestNodeElement(event.target);
            const nodeId = element?.dataset.wbNodeId;
            if (!nodeId || nodeId === document.id) {
              event.preventDefault();
              return;
            }
            const source: DragSource = { kind: 'node', nodeId };
            writeDragSource(event.dataTransfer, source);
            props.onDragStart?.(source);
          }}
          onDragOver={(event) => {
            setHoverOutline(undefined);
            const source = props.dragSource || readDragSource(event.dataTransfer);
            if (!source) return;
            const resolved = resolveEventTarget(event);
            if (!resolved) return;
            event.preventDefault();
            event.stopPropagation();
            const valid = props.canDrop ? props.canDrop(source, resolved.target) : true;
            event.dataTransfer.dropEffect = source.kind === 'palette' ? 'copy' : 'move';
            props.onDropTargetChange?.(resolved.target);
            updateIndicator(resolved.element, resolved.target, valid);
          }}
          onDrop={(event) => {
            const source = props.dragSource || readDragSource(event.dataTransfer);
            const resolved = resolveEventTarget(event);
            if (!source || !resolved) {
              clearDragChrome();
              return;
            }
            event.preventDefault();
            event.stopPropagation();
            const valid = props.canDrop ? props.canDrop(source, resolved.target) : true;
            if (valid) props.onDrop?.(source, resolved.target);
            clearDragChrome();
            props.onDragEnd?.();
          }}
          onDragEnd={() => {
            clearDragChrome();
            props.onDragEnd?.();
          }}
        >
          <WebsiteRenderer schema={document} device={device} selectedNodeId={selectedNodeId} onSelect={onSelect} />

          {hoverOutline && !indicator && (
            <div
              data-wb-hover-outline={hoverOutline.nodeId}
              style={{
                position: 'absolute',
                pointerEvents: 'none',
                zIndex: 80,
                left: hoverOutline.left,
                top: hoverOutline.top,
                width: hoverOutline.width,
                height: hoverOutline.height,
                boxSizing: 'border-box',
                border: '1px dashed #69b1ff',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  maxWidth: '100%',
                  padding: '1px 5px',
                  background: 'rgba(22,119,255,.88)',
                  color: '#fff',
                  fontSize: 11,
                  lineHeight: '18px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {hoverOutline.label}
              </span>
            </div>
          )}

          {indicator && (
            <div
              data-wb-drop-indicator
              style={{
                position: 'absolute',
                pointerEvents: 'none',
                zIndex: 100,
                left: indicator.left,
                top: indicator.top,
                width: indicator.width,
                height: indicator.height,
                boxSizing: 'border-box',
                border: indicator.inside ? `2px dashed ${indicator.valid ? '#1677ff' : '#ff4d4f'}` : undefined,
                background: indicator.inside
                  ? indicator.valid ? 'rgba(22,119,255,.06)' : 'rgba(255,77,79,.06)'
                  : indicator.valid ? '#1677ff' : '#ff4d4f',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
