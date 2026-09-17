import React, { useEffect, useState } from 'react';
import { Alert, Spin } from 'antd';
import { useAPIClient } from '@nocobase/client';
import type { WebsiteNode } from '../../shared/schema';
import { createPageRoot } from '../../shared/schema';
import { WebsiteEditor } from '../editor';
import { getDraft, publishPage, saveDraft } from '../services/websiteApi';

export interface PageEditorPageProps {
  pageId: number | string;
}

export default function PageEditorPage({ pageId }: PageEditorPageProps) {
  const api = useAPIClient();
  const [document, setDocument] = useState<WebsiteNode>();
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    let active = true;
    setError(undefined);
    getDraft(api, pageId)
      .then((draft) => active && setDocument(draft || createPageRoot()))
      .catch((e) => active && setError(e?.message || String(e)));
    return () => { active = false; };
  }, [api, pageId]);

  if (error) return <Alert type="error" showIcon message="加载页面失败" description={error} />;
  if (!document) return <div style={{ padding: 48, textAlign: 'center' }}><Spin /></div>;

  return (
    <WebsiteEditor
      key={String(pageId)}
      initialDocument={document}
      saving={saving}
      publishing={publishing}
      onSave={async (schema) => {
        setSaving(true);
        try {
          await saveDraft(api, pageId, schema);
          setDocument(schema);
        } finally {
          setSaving(false);
        }
      }}
      onPublish={async (schema) => {
        setPublishing(true);
        try {
          await saveDraft(api, pageId, schema);
          await publishPage(api, pageId);
          setDocument(schema);
        } finally {
          setPublishing(false);
        }
      }}
    />
  );
}
