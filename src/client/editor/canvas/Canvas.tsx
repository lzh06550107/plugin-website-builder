import React from 'react';
import type { DeviceType, WebsiteNode } from '../../../shared/schema';
import { findNode, findNodeLocation } from '../../../shared/tree';
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

function closestNodeElement(target: EventTarget | null): HTMLElement | undefined {
  if (!(target instanceof Element)) return undefined;
  return target.closest<HTMLElement>('[data-wb-node-id]') || undefined;
}

export function Canvas(props: CanvasProps) {
  const { document, device, selectedNodeId, onSelect } = props;
  const width = device === 'mobile' ? 390 : '100%';
  const frameRef = React.useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = React.useState<DropIndicator>();

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

  const clearDragChrome = React.useCallback(() => {
    setIndicator(undefined);
    props.onDropTargetChange?.(undefined);
  }, [props.onDropTargetChange]);

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 24, background: '#f5f5f5' }} onClick={() => onSelect(document.id)}>
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
        onDragStart={(event) => {
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
  );
}
