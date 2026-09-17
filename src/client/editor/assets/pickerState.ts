import type { WebsiteAsset } from './types';

export type WebsiteAssetPickerMode = 'library' | 'upload' | 'url';

export interface WebsiteAssetPickerState {
  mode: WebsiteAssetPickerMode;
  selected?: WebsiteAsset;
  url: string;
  alt: string;
}

export type WebsiteAssetPickerAction =
  | { type: 'reset'; src: string; alt: string }
  | { type: 'set-mode'; mode: WebsiteAssetPickerMode }
  | { type: 'select-asset'; mode: 'library' | 'upload'; asset: WebsiteAsset }
  | { type: 'set-url'; value: string }
  | { type: 'set-alt'; value: string };

export function createWebsiteAssetPickerState(initialSrc = '', initialAlt = ''): WebsiteAssetPickerState {
  return {
    mode: 'library',
    url: initialSrc,
    alt: initialAlt,
  };
}

export function reduceWebsiteAssetPickerState(
  state: WebsiteAssetPickerState,
  action: WebsiteAssetPickerAction,
): WebsiteAssetPickerState {
  switch (action.type) {
    case 'reset':
      return createWebsiteAssetPickerState(action.src, action.alt);
    case 'set-mode':
      return { ...state, mode: action.mode };
    case 'select-asset':
      return { ...state, mode: action.mode, selected: action.asset };
    case 'set-url':
      return { ...state, url: action.value };
    case 'set-alt':
      return { ...state, alt: action.value };
    default:
      return state;
  }
}

export function buildAssetApplyValue(state: WebsiteAssetPickerState): { src: string; alt: string } | null {
  const src = state.mode === 'url' ? state.url.trim() : state.selected?.url?.trim();
  if (!src) return null;
  return { src, alt: state.alt };
}
