import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, Drawer, Empty, Form, Input, List, Modal, Space, Tag, Typography, message } from 'antd';
import { useAPIClient } from '@nocobase/client';
import { createPageRoot } from '../../shared/schema';
import PageEditorPage from './PageEditorPage';
import { createPage, createSite, listPages, listSites, type PageRecord, type SiteRecord } from '../services/websiteApi';

export default function WebsiteBuilderSettingsPage() {
  const api = useAPIClient();
  const [sites, setSites] = useState<SiteRecord[]>([]);
  const [selectedSite, setSelectedSite] = useState<SiteRecord>();
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [editingPage, setEditingPage] = useState<PageRecord>();
  const [siteModal, setSiteModal] = useState(false);
  const [pageModal, setPageModal] = useState(false);
  const [siteForm] = Form.useForm();
  const [pageForm] = Form.useForm();

  const loadSites = useCallback(async () => {
    const records = await listSites(api);
    setSites(records);
    setSelectedSite((current) => current || records[0]);
  }, [api]);

  const loadPages = useCallback(async () => {
    if (!selectedSite) {
      setPages([]);
      return;
    }
    setPages(await listPages(api, selectedSite.id));
  }, [api, selectedSite]);

  useEffect(() => { loadSites().catch((e) => message.error(e?.message || '加载站点失败')); }, [loadSites]);
  useEffect(() => { loadPages().catch((e) => message.error(e?.message || '加载页面失败')); }, [loadPages]);

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>Website Builder</Typography.Title>
            <Typography.Text type="secondary">零代码编辑前台网页排版、内容和响应式样式</Typography.Text>
          </div>
          <Button type="primary" onClick={() => setSiteModal(true)}>新建站点</Button>
        </Space>

        <Card title="站点">
          {sites.length === 0 ? <Empty description="尚未创建站点" /> : (
            <Space wrap>
              {sites.map((site) => (
                <Button key={String(site.id)} type={selectedSite?.id === site.id ? 'primary' : 'default'} onClick={() => setSelectedSite(site)}>
                  {site.name} ({site.key})
                </Button>
              ))}
            </Space>
          )}
        </Card>

        <Card title={selectedSite ? `${selectedSite.name} / 页面` : '页面'} extra={<Button disabled={!selectedSite} onClick={() => setPageModal(true)}>新建页面</Button>}>
          <List
            dataSource={pages}
            locale={{ emptyText: '暂无页面' }}
            renderItem={(page) => (
              <List.Item actions={[<Button key="edit" type="link" onClick={() => setEditingPage(page)}>编辑页面</Button>]}>
                <List.Item.Meta title={<Space>{page.title}<Tag>{page.status || 'draft'}</Tag></Space>} description={`${page.routePath} · ${page.slug}`} />
              </List.Item>
            )}
          />
        </Card>
      </Space>

      <Modal title="新建站点" open={siteModal} onCancel={() => setSiteModal(false)} onOk={async () => {
        const values = await siteForm.validateFields();
        await createSite(api, values);
        siteForm.resetFields();
        setSiteModal(false);
        await loadSites();
        message.success('站点已创建');
      }}>
        <Form form={siteForm} layout="vertical">
          <Form.Item name="name" label="站点名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="key" label="站点标识" rules={[{ required: true, pattern: /^[a-z0-9-]+$/ }]}><Input placeholder="company-site" /></Form.Item>
        </Form>
      </Modal>

      <Modal title="新建页面" open={pageModal} onCancel={() => setPageModal(false)} onOk={async () => {
        if (!selectedSite) return;
        const values = await pageForm.validateFields();
        const routePath = values.routePath.startsWith('/') ? values.routePath : `/${values.routePath}`;
        await createPage(api, {
          siteId: selectedSite.id,
          name: values.name,
          title: values.title,
          slug: values.slug,
          routePath,
          status: 'draft',
          draftSchema: createPageRoot(),
        });
        pageForm.resetFields();
        setPageModal(false);
        await loadPages();
        message.success('页面已创建');
      }}>
        <Form form={pageForm} layout="vertical">
          <Form.Item name="name" label="内部名称" rules={[{ required: true }]}><Input placeholder="Home" /></Form.Item>
          <Form.Item name="title" label="页面标题" rules={[{ required: true }]}><Input placeholder="首页" /></Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}><Input placeholder="home" /></Form.Item>
          <Form.Item name="routePath" label="路由" initialValue="/" rules={[{ required: true }]}><Input placeholder="/" /></Form.Item>
        </Form>
      </Modal>

      <Drawer title={editingPage ? `编辑：${editingPage.title}` : '页面编辑器'} open={!!editingPage} onClose={() => { setEditingPage(undefined); loadPages(); }} width="100vw" destroyOnClose>
        {editingPage && <PageEditorPage pageId={editingPage.id} />}
      </Drawer>
    </div>
  );
}
