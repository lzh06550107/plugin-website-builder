import type { DragSource } from './types';

export const WEBSITE_BUILDER_DRAG_MIME = 'application/x-website-builder';

export function serializeDragSource(source: DragSource) {
  return JSON.stringify(source);
}

export function parseDragSource(value: string): DragSource | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as Partial<DragSource>;
    if (parsed.kind === 'palette' && typeof (parsed as { componentType?: unknown }).componentType === 'string') {
      return { kind: 'palette', componentType: (parsed as { componentType: string }).componentType };
    }
    if (parsed.kind === 'node' && typeof (parsed as { nodeId?: unknown }).nodeId === 'string') {
      return { kind: 'node', nodeId: (parsed as { nodeId: string }).nodeId };
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function writeDragSource(dataTransfer: DataTransfer, source: DragSource) {
  dataTransfer.setData(WEBSITE_BUILDER_DRAG_MIME, serializeDragSource(source));
  dataTransfer.setData('text/plain', serializeDragSource(source));
  dataTransfer.effectAllowed = source.kind === 'palette' ? 'copy' : 'move';
}

export function readDragSource(dataTransfer: DataTransfer) {
  return parseDragSource(
    dataTransfer.getData(WEBSITE_BUILDER_DRAG_MIME) || dataTransfer.getData('text/plain'),
  );
}
