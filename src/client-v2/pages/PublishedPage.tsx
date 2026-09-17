import React, { useEffect, useState } from 'react';
import { Alert, Spin } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';
import type { WebsiteNode } from '../../shared/schema';
import { WebsiteRenderer } from '../../client/renderer';
import { getPublishedByPath } from '../../client/services/websiteApi';

export default function PublishedPage() {
  const ctx = useFlowContext();
  const api = ctx.api;
  const siteKey = String(ctx.route?.params?.siteKey || '');
  const marker = `/website/${siteKey}`;
  const pathname = window.location.pathname.replace(/^\/v/, '');
  const routePath = pathname.startsWith(marker) ? pathname.slice(marker.length) || '/' : '/';
  const [schema, setSchema] = useState<WebsiteNode>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    getPublishedByPath(api, siteKey, routePath)
      .then((version) => {
        if (!active) return;
        if (!version?.schema) throw new Error('页面尚未发布或不存在');
        setSchema(version.schema);
      })
      .catch((e) => active && setError(e?.message || String(e)));
    return () => { active = false; };
  }, [api, siteKey, routePath]);

  if (error) return <Alert type="error" showIcon message="页面不可用" description={error} />;
  if (!schema) return <div style={{ padding: 80, textAlign: 'center' }}><Spin /></div>;
  return <WebsiteRenderer schema={schema} device={window.innerWidth <= 767 ? 'mobile' : 'desktop'} />;
}
