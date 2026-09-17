import React from 'react';
import { Button, Space, Typography } from 'antd';
import type { DeviceType, WebsiteNode } from '../../../shared/schema';
import { findNode, findNodeLocation, getNodePath } from '../../../shared/tree';
import { componentRegistry } from '../../registry';
import { WebsiteRenderer } from '../../renderer';
import type { DragSource, DropTarget } from '../dnd';
import { readDragSource, resolveDropTarget, writeDragSource } from '../dnd';
import { resolveSelectionToolbarPlacement } from './selectionToolbar';

export interface CanvasProps {
  document: WebsiteNode;
  device: DeviceType;
  selectedNodeId?: string;
  dragSource?: DragSource;
  onSelect: (nodeId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDuplicateNode?: (nodeId: string) => void;
  onMoveNodeRelative?: (nodeId: string, direction: 'up' | 'down') => void;
  hasStyleClipboard?: boolean;
  onCopyNodeStyle?: (nodeId: string) => void;
  onPasteNodeStyle?: (nodeId: string) => void;
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

interface CanvasContextMenu {
  nodeId: string;
  label: string;
  x: number;
  y: number;
}

interface SelectionToolbarChrome {
  nodeId: string;
  label: string;
  left: number;
  top: number;
  side: 'above' | 'below';
}

const SELECTION_TOOLBAR_WIDTH = 244;
const SELECTION_TOOLBAR_HEIGHT = 32;

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
  const [contextMenu, setContextMenu] = React.useState<CanvasContextMenu>();
  const [selectionToolbar, setSelectionToolbar] = React.useState<SelectionToolbarChrome>();
  const selectionPath = React.useMemo(
    () => getNodePath(document, selectedNodeId || document.id),
    [document, selectedNodeId],
  );
  const contextLocation = React.useMemo(
    () => (contextMenu ? findNodeLocation(document, contextMenu.nodeId) : undefined),
    [contextMenu, document],
  );

  const updateSelectionToolbar = React.useCallback(() => {
    if (!selectedNodeId || selectedNodeId === document.id || props.dragSource) {
      setSelectionToolbar(undefined);
      return;
    }

    const frame = frameRef.current;
    const node = findNode(document, selectedNodeId);
    if (!frame || !node) {
      setSelectionToolbar(undefined);
      return;
    }

    const element = findNodeElement(frame, selectedNodeId);
    if (!element) {
      setSelectionToolbar(undefined);
      return;
    }

    const frameRect = frame.getBoundingClientRect();
    const nodeRect = element.getBoundingClientRect();
    const placement = resolveSelectionToolbarPlacement(
      { left: frameRect.left, top: frameRect.top, width: frameRect.width, height: frameRect.height },
      { left: nodeRect.left, top: nodeRect.top, width: nodeRect.width, height: nodeRect.height },
      { width: SELECTION_TOOLBAR_WIDTH, height: SELECTION_TOOLBAR_HEIGHT },
    );

    setSelectionToolbar({
      nodeId: node.id,
      label: describeNode(node),
      ...placement,
    });
  }, [document, props.dragSource, selectedNodeId]);

  React.useLayoutEffect(() => {
    updateSelectionToolbar();
    window.addEventListener('resize', updateSelectionToolbar);

    const frame = frameRef.current;
    const element = frame && selectedNodeId ? findNodeElement(frame, selectedNodeId) : undefined;
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateSelectionToolbar) : undefined;
    if (frame) observer?.observe(frame);
    if (element) observer?.observe(element);

    return () => {
      window.removeEventListener('resize', updateSelectionToolbar);
      observer?.disconnect();
    };
  }, [device, selectedNodeId, updateSelectionToolbar]);

  React.useEffect(() => {
    if (!selectedNodeId || selectedNodeId === document.id) return;
    const frame = frameRef.current;
    if (!frame) return;
    const element = findNodeElement(frame, selectedNodeId);
    element?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [selectedNodeId, document.id]);

  React.useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(undefined);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [contextMenu]);

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
    if (props.dragSource || contextMenu) {
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
  }, [contextMenu, document, props.dragSource]);

  const clearDragChrome = React.useCallback(() => {
    setIndicator(undefined);
    props.onDropTargetChange?.(undefined);
  }, [props.onDropTargetChange]);

  const showContextMenuForNode = React.useCallback((nodeId: string, x: number, y: number) => {
    const node = findNode(document, nodeId) || document;
    setHoverOutline(undefined);
    onSelect(node.id);
    setContextMenu({
      nodeId: node.id,
      label: describeNode(node),
      x,
      y,
    });
  }, [document, onSelect]);

  const openContextMenu = React.useCallback((event: React.MouseEvent) => {
    const element = closestNodeElement(event.target);
    const nodeId = element?.dataset.wbNodeId || document.id;
    event.preventDefault();
    event.stopPropagation();
    showContextMenuForNode(nodeId, event.clientX, event.clientY);
  }, [document.id, showContextMenuForNode]);

  const selectedIsRoot = !selectedNodeId || selectedNodeId === document.id;
  const contextIsRoot = !contextMenu || contextMenu.nodeId === document.id;
  const canMoveContextUp = Boolean(contextLocation?.parent && contextLocation.index > 0);
  const canMoveContextDown = Boolean(
    contextLocation?.parent && contextLocation.index < contextLocation.parent.children.length - 1,
  );

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
        {!selectedIsRoot && props.onDeleteNode && selectedNodeId && (
          <Button danger size="small" onClick={() => props.onDeleteNode?.(selectedNodeId)}>
            删除当前组件
          </Button>
        )}
      </div>

      <div
        style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 24, background: '#f5f5f5' }}
        onClick={() => onSelect(document.id)}
        onContextMenu={(event) => {
          if (event.target === event.currentTarget) openContextMenu(event);
        }}
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
          onContextMenu={openContextMenu}
          onDragStart={(event) => {
            setHoverOutline(undefined);
            setContextMenu(undefined);
            setSelectionToolbar(undefined);
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
            setContextMenu(undefined);
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

          {selectionToolbar && !indicator && (
            <div
              data-wb-selection-toolbar={selectionToolbar.nodeId}
              title={selectionToolbar.label}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              onContextMenu={(event) => event.preventDefault()}
              style={{
                position: 'absolute',
                zIndex: 120,
                left: selectionToolbar.left,
                top: selectionToolbar.top,
                width: SELECTION_TOOLBAR_WIDTH,
                height: SELECTION_TOOLBAR_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                padding: 2,
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                background: '#fff',
                boxShadow: '0 4px 14px rgba(0,0,0,.14)',
              }}
            >
              <Button
                size="small"
                type="text"
                draggable
                style={{ cursor: 'grab', flex: 1 }}
                onDragStart={(event) => {
                  event.stopPropagation();
                  setHoverOutline(undefined);
                  setContextMenu(undefined);
                  setSelectionToolbar(undefined);
                  const source: DragSource = { kind: 'node', nodeId: selectionToolbar.nodeId };
                  writeDragSource(event.dataTransfer, source);
                  props.onDragStart?.(source);
                }}
                onDragEnd={(event) => {
                  event.stopPropagation();
                  props.onDragEnd?.();
                }}
              >
                拖动
              </Button>
              <Button
                size="small"
                type="text"
                style={{ flex: 1 }}
                disabled={!props.onDuplicateNode}
                onClick={() => props.onDuplicateNode?.(selectionToolbar.nodeId)}
              >
                复制
              </Button>
              <Button
                size="small"
                danger
                type="text"
                style={{ flex: 1 }}
                disabled={!props.onDeleteNode}
                onClick={() => props.onDeleteNode?.(selectionToolbar.nodeId)}
              >
                删除
              </Button>
              <Button
                size="small"
                type="text"
                style={{ flex: 1 }}
                onClick={(event) => {
                  event.stopPropagation();
                  const rect = event.currentTarget.getBoundingClientRect();
                  showContextMenuForNode(selectionToolbar.nodeId, rect.left, rect.bottom + 4);
                }}
              >
                更多
              </Button>
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

      {contextMenu && (
        <div
          data-wb-context-menu={contextMenu.nodeId}
          onMouseDown={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 2000,
            minWidth: 190,
            padding: 6,
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            background: '#fff',
            boxShadow: '0 8px 24px rgba(0,0,0,.16)',
          }}
        >
          <Typography.Text type="secondary" style={{ display: 'block', padding: '4px 8px 6px', fontSize: 12 }}>
            {contextMenu.label}
          </Typography.Text>
          <Button
            block
            type="text"
            disabled={contextIsRoot || !props.onDuplicateNode}
            style={{ textAlign: 'left' }}
            onClick={() => {
              const nodeId = contextMenu.nodeId;
              setContextMenu(undefined);
              props.onDuplicateNode?.(nodeId);
            }}
          >
            复制组件
          </Button>
          <Button
            block
            type="text"
            disabled={!canMoveContextUp || !props.onMoveNodeRelative}
            style={{ textAlign: 'left' }}
            onClick={() => {
              const nodeId = contextMenu.nodeId;
              setContextMenu(undefined);
              props.onMoveNodeRelative?.(nodeId, 'up');
            }}
          >
            上移
          </Button>
          <Button
            block
            type="text"
            disabled={!canMoveContextDown || !props.onMoveNodeRelative}
            style={{ textAlign: 'left' }}
            onClick={() => {
              const nodeId = contextMenu.nodeId;
              setContextMenu(undefined);
              props.onMoveNodeRelative?.(nodeId, 'down');
            }}
          >
            下移
          </Button>
          <div style={{ height: 1, margin: '5px 4px', background: '#f0f0f0' }} />
          <Button
            block
            type="text"
            disabled={!props.onCopyNodeStyle}
            style={{ textAlign: 'left' }}
            onClick={() => {
              const nodeId = contextMenu.nodeId;
              setContextMenu(undefined);
              props.onCopyNodeStyle?.(nodeId);
            }}
          >
            复制样式
          </Button>
          <Button
            block
            type="text"
            disabled={!props.hasStyleClipboard || !props.onPasteNodeStyle}
            style={{ textAlign: 'left' }}
            onClick={() => {
              const nodeId = contextMenu.nodeId;
              setContextMenu(undefined);
              props.onPasteNodeStyle?.(nodeId);
            }}
          >
            粘贴样式
          </Button>
          <div style={{ height: 1, margin: '5px 4px', background: '#f0f0f0' }} />
          <Button
            block
            danger
            type="text"
            disabled={contextIsRoot || !props.onDeleteNode}
            style={{ textAlign: 'left' }}
            onClick={() => {
              const nodeId = contextMenu.nodeId;
              setContextMenu(undefined);
              props.onDeleteNode?.(nodeId);
            }}
          >
            删除组件
          </Button>
        </div>
      )}
    </div>
  );
}
