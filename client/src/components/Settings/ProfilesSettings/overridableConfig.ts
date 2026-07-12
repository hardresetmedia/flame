import { Config } from '../../../interfaces';

// Client mirror of the server's OVERRIDABLE_CONFIG_KEYS (utils/configKeys.js).
// Each entry describes how the override editor renders that key. Keep the two
// lists in sync — the server rejects any override key not in its list.
type OverrideControl =
  | { kind: 'bool' }
  | { kind: 'text'; placeholder?: string }
  | { kind: 'select'; options: { value: string; label: string }[] };

export interface OverridableField {
  key: keyof Config;
  label: string;
  control: OverrideControl;
}

export const OVERRIDABLE_FIELDS: OverridableField[] = [
  { key: 'customTitle', label: 'Custom page title', control: { kind: 'text', placeholder: 'Flame' } },
  { key: 'hideHeader', label: 'Hide header (greeting + weather)', control: { kind: 'bool' } },
  { key: 'hideApps', label: 'Hide applications section', control: { kind: 'bool' } },
  { key: 'hideCategories', label: 'Hide bookmarks section', control: { kind: 'bool' } },
  { key: 'hideSearch', label: 'Hide search bar', control: { kind: 'bool' } },
  { key: 'hideDate', label: 'Hide date', control: { kind: 'bool' } },
  { key: 'showTime', label: 'Show time', control: { kind: 'bool' } },
  {
    key: 'defaultSearchProvider',
    label: 'Default search provider prefix',
    control: { kind: 'text', placeholder: 'l' },
  },
  { key: 'appsSameTab', label: 'Open apps in the same tab', control: { kind: 'bool' } },
  { key: 'bookmarksSameTab', label: 'Open bookmarks in the same tab', control: { kind: 'bool' } },
  { key: 'searchSameTab', label: 'Open search in the same tab', control: { kind: 'bool' } },
  {
    key: 'useOrdering',
    label: 'Ordering',
    control: {
      kind: 'select',
      options: [
        { value: 'createdAt', label: 'By creation date' },
        { value: 'name', label: 'Alphabetical' },
        { value: 'orderId', label: 'Custom order' },
      ],
    },
  },
];
