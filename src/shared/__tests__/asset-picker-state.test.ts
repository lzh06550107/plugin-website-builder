import test from 'node:test';
import assert from 'node:assert/strict';

async function loadPickerState() {
  let module: any;
  try {
    module = await import('../../client/editor/assets/pickerState');
  } catch {}
  assert.equal(typeof module?.createWebsiteAssetPickerState, 'function', 'picker state factory must exist');
  assert.equal(typeof module?.reduceWebsiteAssetPickerState, 'function', 'picker reducer must exist');
  assert.equal(typeof module?.buildAssetApplyValue, 'function', 'apply builder must exist');
  return module;
}

test('current image remains applicable until a new library asset is selected', async () => {
  const { createWebsiteAssetPickerState, reduceWebsiteAssetPickerState, buildAssetApplyValue } = await loadPickerState();
  const initial = createWebsiteAssetPickerState('/old.png', 'Old alt');
  assert.deepEqual(buildAssetApplyValue(initial), { src: '/old.png', alt: 'Old alt' });

  const selected = reduceWebsiteAssetPickerState(initial, {
    type: 'select-asset',
    mode: 'library',
    asset: { id: 1, mimetype: 'image/png', url: '/new.png', title: 'New image' },
  });

  assert.equal(initial.selected, undefined);
  assert.deepEqual(buildAssetApplyValue(selected), { src: '/new.png', alt: 'Old alt' });
});

test('upload selection applies the uploaded asset URL without mutating the original state', async () => {
  const { createWebsiteAssetPickerState, reduceWebsiteAssetPickerState, buildAssetApplyValue } = await loadPickerState();
  const initial = createWebsiteAssetPickerState('/old.png', 'Product');
  const next = reduceWebsiteAssetPickerState(initial, {
    type: 'select-asset',
    mode: 'upload',
    asset: { id: 2, mimetype: 'image/jpeg', url: '/uploaded.jpg' },
  });

  assert.equal(initial.mode, 'library');
  assert.equal(initial.selected, undefined);
  assert.deepEqual(buildAssetApplyValue(next), { src: '/uploaded.jpg', alt: 'Product' });
});

test('URL mode trims the URL, preserves alt text, and rejects an empty URL', async () => {
  const { createWebsiteAssetPickerState, reduceWebsiteAssetPickerState, buildAssetApplyValue } = await loadPickerState();
  let state = createWebsiteAssetPickerState('', 'Alt text');
  state = reduceWebsiteAssetPickerState(state, { type: 'set-mode', mode: 'url' });
  state = reduceWebsiteAssetPickerState(state, { type: 'set-url', value: '  https://cdn.example.com/a.png  ' });
  assert.deepEqual(buildAssetApplyValue(state), { src: 'https://cdn.example.com/a.png', alt: 'Alt text' });

  state = reduceWebsiteAssetPickerState(state, { type: 'set-url', value: '   ' });
  assert.equal(buildAssetApplyValue(state), null);
});

test('changing alt in library mode can preserve the current src', async () => {
  const { createWebsiteAssetPickerState, reduceWebsiteAssetPickerState, buildAssetApplyValue } = await loadPickerState();
  const initial = createWebsiteAssetPickerState('/old.png', 'Old alt');
  const state = reduceWebsiteAssetPickerState(initial, { type: 'set-alt', value: 'New alt' });

  assert.equal(initial.alt, 'Old alt');
  assert.deepEqual(buildAssetApplyValue(state), { src: '/old.png', alt: 'New alt' });
});

test('reset clears stale selection when the picker opens for another image', async () => {
  const { createWebsiteAssetPickerState, reduceWebsiteAssetPickerState } = await loadPickerState();
  const initial = createWebsiteAssetPickerState('/one.png', 'One');
  const selected = reduceWebsiteAssetPickerState(initial, {
    type: 'select-asset',
    mode: 'library',
    asset: { id: 1, mimetype: 'image/png', url: '/picked.png' },
  });
  const reset = reduceWebsiteAssetPickerState(selected, {
    type: 'reset',
    src: '/two.png',
    alt: 'Two',
  });

  assert.equal(reset.selected, undefined);
  assert.equal(reset.url, '/two.png');
  assert.equal(reset.alt, 'Two');
  assert.equal(reset.mode, 'library');
});

test('switching picker modes clears a stale asset selection', async () => {
  const { createWebsiteAssetPickerState, reduceWebsiteAssetPickerState, buildAssetApplyValue } = await loadPickerState();
  let state = createWebsiteAssetPickerState('/current.png', 'Alt');
  state = reduceWebsiteAssetPickerState(state, {
    type: 'select-asset',
    mode: 'library',
    asset: { id: 1, mimetype: 'image/png', url: '/library.png' },
  });
  state = reduceWebsiteAssetPickerState(state, { type: 'set-mode', mode: 'upload' });

  assert.equal(state.selected, undefined);
  assert.deepEqual(buildAssetApplyValue(state), { src: '/current.png', alt: 'Alt' });
});
