import React from 'react';
import { useWebsiteEditorInteractions } from '../renderer/editorInteractions';
import type { WebsiteComponentDefinition, WebsiteComponentRenderProps } from './types';

function frameProps(props: WebsiteComponentRenderProps, draggableOverride?: boolean) {
  const editing = Boolean(props.onSelect);
  return {
    style: props.style,
    draggable: editing && props.node.type !== 'wb.page' ? draggableOverride ?? true : undefined,
    'data-wb-node-id': props.node.id,
    'data-wb-node-type': props.node.type,
    onClick: (event: React.MouseEvent) => {
      if (props.onSelect) event.preventDefault();
      event.stopPropagation();
      props.onSelect?.(props.node.id);
    },
  };
}

const Page = (props: WebsiteComponentRenderProps) => <main {...frameProps(props)}>{props.children}</main>;
const Section = (props: WebsiteComponentRenderProps) => <section {...frameProps(props)}>{props.children}</section>;
const Container = (props: WebsiteComponentRenderProps) => <div {...frameProps(props)}>{props.children}</div>;
const Grid = (props: WebsiteComponentRenderProps) => {
  const columns = Math.max(1, Number(props.node.props.columns || 3));
  const style: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: '24px',
    ...props.style,
  };
  return <div {...frameProps({ ...props, style })}>{props.children}</div>;
};

function InlineTextInput({
  value,
  multiline,
  onChange,
  onCommit,
  onCancel,
}: {
  value: string;
  multiline: boolean;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const commonStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    font: 'inherit',
    color: 'inherit',
    lineHeight: 'inherit',
    letterSpacing: 'inherit',
    textAlign: 'inherit',
    background: 'rgba(255,255,255,.96)',
    border: '1px solid #1677ff',
    borderRadius: 2,
    outline: 'none',
    padding: 0,
    margin: 0,
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
      return;
    }
    const shouldCommit = multiline
      ? event.key === 'Enter' && (event.ctrlKey || event.metaKey)
      : event.key === 'Enter';
    if (shouldCommit) {
      event.preventDefault();
      onCommit();
    }
  };

  if (multiline) {
    return (
      <textarea
        autoFocus
        value={value}
        rows={Math.max(2, value.split('\n').length)}
        style={{ ...commonStyle, resize: 'vertical', minHeight: '2.5em' }}
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onCommit}
      />
    );
  }

  return (
    <input
      autoFocus
      value={value}
      style={commonStyle}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={onCommit}
    />
  );
}

function useInlineTextEditing(props: WebsiteComponentRenderProps) {
  const { onInlineTextCommit } = useWebsiteEditorInteractions();
  const sourceText = String(props.node.props.text || '');
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(sourceText);

  React.useEffect(() => {
    if (!editing) setDraft(sourceText);
  }, [editing, sourceText]);

  const canEdit = Boolean(props.onSelect && onInlineTextCommit);

  const startEditing = (event: React.MouseEvent) => {
    if (!canEdit) return;
    event.preventDefault();
    event.stopPropagation();
    props.onSelect?.(props.node.id);
    setDraft(sourceText);
    setEditing(true);
  };

  const commit = () => {
    if (!editing) return;
    setEditing(false);
    if (draft !== sourceText) onInlineTextCommit?.(props.node.id, draft);
  };

  const cancel = () => {
    setDraft(sourceText);
    setEditing(false);
  };

  return { editing, draft, setDraft, startEditing, commit, cancel };
}

const Heading = (props: WebsiteComponentRenderProps) => {
  const level = Math.min(6, Math.max(1, Number(props.node.props.level || 2)));
  const inline = useInlineTextEditing(props);
  return React.createElement(
    `h${level}`,
    {
      ...frameProps(props, inline.editing ? false : undefined),
      onDoubleClick: inline.startEditing,
    },
    inline.editing ? (
      <InlineTextInput
        value={inline.draft}
        multiline={false}
        onChange={inline.setDraft}
        onCommit={inline.commit}
        onCancel={inline.cancel}
      />
    ) : String(props.node.props.text || ''),
  );
};

const Text = (props: WebsiteComponentRenderProps) => {
  const inline = useInlineTextEditing(props);
  return (
    <p {...frameProps(props, inline.editing ? false : undefined)} onDoubleClick={inline.startEditing}>
      {inline.editing ? (
        <InlineTextInput
          value={inline.draft}
          multiline
          onChange={inline.setDraft}
          onCommit={inline.commit}
          onCancel={inline.cancel}
        />
      ) : String(props.node.props.text || '')}
    </p>
  );
};

const Image = (props: WebsiteComponentRenderProps) => (
  <img {...frameProps(props)} src={String(props.node.props.src || '')} alt={String(props.node.props.alt || '')} />
);
const Button = (props: WebsiteComponentRenderProps) => (
  <a {...frameProps(props)} href={String(props.node.props.href || '#')}>
    {String(props.node.props.text || 'Button')}
  </a>
);

const CONTENT_TYPES = ['wb.heading', 'wb.text', 'wb.image', 'wb.button'];

export const builtinComponentDefinitions: WebsiteComponentDefinition[] = [
  {
    type: 'wb.page',
    label: 'Page',
    category: 'layout',
    acceptsChildren: true,
    allowedChildTypes: ['wb.container'],
    render: Page,
  },
  {
    // Legacy compatibility only. New pages no longer create Section nodes.
    type: 'wb.section',
    label: 'Section',
    category: 'layout',
    acceptsChildren: true,
    allowedChildTypes: ['wb.container'],
    render: Section,
  },
  {
    type: 'wb.container',
    label: 'Container',
    category: 'layout',
    acceptsChildren: true,
    allowedChildTypes: ['wb.grid'],
    render: Container,
  },
  {
    type: 'wb.grid',
    label: 'Grid',
    category: 'layout',
    acceptsChildren: true,
    allowedChildTypes: CONTENT_TYPES,
    render: Grid,
  },
  { type: 'wb.heading', label: 'Heading', category: 'content', acceptsChildren: false, render: Heading },
  { type: 'wb.text', label: 'Text', category: 'content', acceptsChildren: false, render: Text },
  { type: 'wb.image', label: 'Image', category: 'content', acceptsChildren: false, render: Image },
  { type: 'wb.button', label: 'Button', category: 'content', acceptsChildren: false, render: Button },
];
