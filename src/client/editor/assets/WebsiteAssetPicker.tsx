import React from 'react';
import { Upload, useAPIClient } from '@nocobase/client';
import { Alert, Button, Empty, Input, Modal, Pagination, Spin, Tabs, Typography, message } from 'antd';
import { buildAssetApplyValue, createWebsiteAssetPickerState, reduceWebsiteAssetPickerState } from './pickerState';
import { listWebsiteAssets, normalizeWebsiteAsset } from './assetApi';
import type { WebsiteAsset, WebsiteAssetPickerMode } from './index';

export interface WebsiteAssetPickerProps {
  open: boolean;
  initialSrc: string;
  initialAlt: string;
  onCancel: () => void;
  onApply: (value: { src: string; alt: string }) => void;
}

const PAGE_SIZE = 12;

function assetLabel(asset: WebsiteAsset) {
  return asset.title || asset.filename || `#${asset.id}`;
}

export function WebsiteAssetPicker({
  open,
  initialSrc,
  initialAlt,
  onCancel,
  onApply,
}: WebsiteAssetPickerProps) {
  const api = useAPIClient();
  const [state, dispatch] = React.useReducer(
    reduceWebsiteAssetPickerState,
    undefined,
    () => createWebsiteAssetPickerState(initialSrc, initialAlt),
  );
  const [assets, setAssets] = React.useState<WebsiteAsset[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [libraryError, setLibraryError] = React.useState<string>();
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    if (!open) return;
    dispatch({ type: 'reset', src: initialSrc, alt: initialAlt });
    setPage(1);
    setSearch('');
    setLibraryError(undefined);
    setReloadToken((value) => value + 1);
  }, [open, initialSrc, initialAlt]);

  React.useEffect(() => {
    if (!open || state.mode !== 'library') return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setLibraryError(undefined);
      try {
        const result = await listWebsiteAssets(api, { page, pageSize: PAGE_SIZE, search });
        if (cancelled) return;
        setAssets(result.items);
        setTotal(result.total);
      } catch (error) {
        if (cancelled) return;
        setAssets([]);
        setTotal(0);
        setLibraryError(error instanceof Error ? error.message : '媒体库加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, search.trim() ? 250 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [api, open, page, reloadToken, search, state.mode]);

  const applyValue = buildAssetApplyValue(state);
  const previewSrc = state.mode === 'url'
    ? state.url.trim()
    : state.selected?.preview || state.selected?.url || '';

  const handleApply = () => {
    const value = buildAssetApplyValue(state);
    if (!value) {
      message.warning('请选择图片或填写图片 URL');
      return;
    }
    onApply(value);
  };

  const handleUploadChange = (value: any) => {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    const record = values[values.length - 1];
    const asset = normalizeWebsiteAsset(record);
    if (!asset) return;

    dispatch({ type: 'select-asset', mode: 'upload', asset });
    setReloadToken((current) => current + 1);
    message.success('图片上传成功');
  };

  const libraryContent = (
    <div>
      <Input.Search
        allowClear
        value={search}
        placeholder="搜索图片名称或文件名"
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />

      {libraryError && (
        <Alert
          showIcon
          type="warning"
          style={{ marginTop: 12 }}
          message="媒体库暂不可用"
          description={libraryError}
          action={<Button size="small" onClick={() => setReloadToken((value) => value + 1)}>重试</Button>}
        />
      )}

      <Spin spinning={loading}>
        <div
          style={{
            minHeight: 260,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 12,
            marginTop: 12,
            alignContent: 'start',
          }}
        >
          {!loading && !libraryError && assets.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '48px 0' }}>
              <Empty description="暂无图片" />
            </div>
          ) : assets.map((asset) => {
            const selected = state.mode === 'library' && state.selected?.id === asset.id;
            return (
              <button
                type="button"
                key={String(asset.id)}
                title={assetLabel(asset)}
                onClick={() => dispatch({ type: 'select-asset', mode: 'library', asset })}
                style={{
                  padding: 6,
                  border: selected ? '2px solid #1677ff' : '1px solid #d9d9d9',
                  borderRadius: 6,
                  background: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <img
                  src={asset.preview || asset.url}
                  alt={assetLabel(asset)}
                  style={{ width: '100%', aspectRatio: '4 / 3', display: 'block', objectFit: 'cover', borderRadius: 4 }}
                />
                <Typography.Text
                  ellipsis={{ tooltip: assetLabel(asset) }}
                  style={{ display: 'block', marginTop: 6, fontSize: 12 }}
                >
                  {assetLabel(asset)}
                </Typography.Text>
              </button>
            );
          })}
        </div>
      </Spin>

      {total > PAGE_SIZE && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <Pagination
            size="small"
            current={page}
            pageSize={PAGE_SIZE}
            total={total}
            showSizeChanger={false}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );

  const uploadContent = (
    <div>
      <Typography.Paragraph type="secondary">
        图片上传到 Website Builder 媒体库。上传成功后仍需点击“应用”才会修改当前 Image 组件。
      </Typography.Paragraph>
      <Upload
        action="wbAssets:create"
        accept="image/*"
        maxCount={1}
        multiple={false}
        showUploadList={false}
        onChange={handleUploadChange}
      >
        <Button>选择图片并上传</Button>
      </Upload>
      {state.mode === 'upload' && state.selected && (
        <div style={{ marginTop: 16 }}>
          <Typography.Text strong>{assetLabel(state.selected)}</Typography.Text>
          <img
            src={state.selected.preview || state.selected.url}
            alt={assetLabel(state.selected)}
            style={{ display: 'block', maxWidth: '100%', maxHeight: 260, objectFit: 'contain', marginTop: 8, border: '1px solid #eee' }}
          />
        </div>
      )}
    </div>
  );

  const urlContent = (
    <div>
      <Typography.Text>图片 URL</Typography.Text>
      <Input
        value={state.url}
        style={{ marginTop: 6 }}
        placeholder="https://cdn.example.com/image.jpg / /files/image.jpg"
        onChange={(event) => dispatch({ type: 'set-url', value: event.target.value })}
      />
      {state.mode === 'url' && previewSrc && (
        <img
          src={previewSrc}
          alt={state.alt}
          style={{ display: 'block', maxWidth: '100%', maxHeight: 260, objectFit: 'contain', marginTop: 12, border: '1px solid #eee' }}
        />
      )}
    </div>
  );

  return (
    <Modal
      open={open}
      title="替换图片"
      width={760}
      okText="应用"
      cancelText="取消"
      destroyOnClose
      okButtonProps={{ disabled: !applyValue }}
      onOk={handleApply}
      onCancel={onCancel}
    >
      <Tabs
        activeKey={state.mode}
        onChange={(key) => dispatch({ type: 'set-mode', mode: key as WebsiteAssetPickerMode })}
        items={[
          { key: 'library', label: '媒体库', children: libraryContent },
          { key: 'upload', label: '上传图片', children: uploadContent },
          { key: 'url', label: '图片 URL', children: urlContent },
        ]}
      />

      <div style={{ marginTop: 16 }}>
        <Typography.Text>Alt</Typography.Text>
        <Input
          value={state.alt}
          style={{ marginTop: 6 }}
          placeholder="图片替代文字"
          onChange={(event) => dispatch({ type: 'set-alt', value: event.target.value })}
        />
      </div>
    </Modal>
  );
}
