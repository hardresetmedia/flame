import { FormEvent, useState } from 'react';
import { useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';
import { useDispatch } from 'react-redux';

import { State } from '../../../store/reducers';
import { actionCreators } from '../../../store';
import {
  Config,
  NewProfile,
  Profile,
  ProfileRule,
} from '../../../interfaces';
import { InputGroup, Button } from '../../UI';
import { RulesEditor } from './RulesEditor';
import { OVERRIDABLE_FIELDS } from './overridableConfig';
import classes from './ProfilesSettings.module.css';

interface Props {
  profile: Profile | null;
  onDone: () => void;
}

const emptyForm: NewProfile = {
  name: '',
  isDefault: false,
  theme: null,
  overrides: null,
  rules: [],
};

export const ProfileForm = ({ profile, onDone }: Props): JSX.Element => {
  const { themes, userThemes } = useSelector((state: State) => state.theme);

  const dispatch = useDispatch();
  const { addProfile, updateProfile } = bindActionCreators(
    actionCreators,
    dispatch
  );

  const [form, setForm] = useState<NewProfile>(
    profile
      ? {
          name: profile.name,
          isDefault: profile.isDefault,
          theme: profile.theme,
          overrides: profile.overrides,
          rules: profile.rules ?? [],
        }
      : emptyForm
  );

  const overrides = form.overrides ?? {};

  const setOverride = (key: keyof Config, value: unknown) => {
    setForm({ ...form, overrides: { ...overrides, [key]: value } });
  };

  const toggleOverrideKey = (key: keyof Config, enabled: boolean) => {
    const next: Partial<Config> = { ...overrides };

    if (enabled) {
      // seed with a sensible empty value
      const field = OVERRIDABLE_FIELDS.find((f) => f.key === key)!;
      (next as Record<string, unknown>)[key] =
        field.control.kind === 'bool' ? false : '';
    } else {
      delete (next as Record<string, unknown>)[key];
    }

    setForm({
      ...form,
      overrides: Object.keys(next).length ? next : null,
    });
  };

  const submitHandler = (e: FormEvent) => {
    e.preventDefault();

    const payload: Partial<NewProfile> = {
      name: form.name,
      isDefault: form.isDefault,
      theme: form.theme || null,
      overrides: form.overrides,
      rules: form.rules,
    };

    if (profile) {
      updateProfile(profile.id, payload);
    } else {
      addProfile(payload);
    }

    onDone();
  };

  const allThemes = [...themes, ...userThemes];

  return (
    <form onSubmit={submitHandler} className={classes.ProfileForm}>
      <InputGroup>
        <label htmlFor="name">Profile name</label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="novastream"
          required
          pattern="[A-Za-z0-9_-]+"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <span>
          Used in the URL: <code>#!/{form.name || 'name'}</code>. Letters,
          digits, <code>-</code> and <code>_</code> only.
        </span>
      </InputGroup>

      <InputGroup>
        <label htmlFor="isDefault">Default profile</label>
        <select
          id="isDefault"
          name="isDefault"
          value={form.isDefault ? 1 : 0}
          onChange={(e) =>
            setForm({ ...form, isDefault: e.target.value === '1' })
          }
        >
          <option value={0}>No</option>
          <option value={1}>Yes — activate when nothing else matches</option>
        </select>
      </InputGroup>

      <InputGroup>
        <label htmlFor="theme">Theme</label>
        <select
          id="theme"
          name="theme"
          value={form.theme ?? ''}
          onChange={(e) =>
            setForm({ ...form, theme: e.target.value || null })
          }
        >
          <option value="">Inherit global theme</option>
          {allThemes.map((theme) => (
            <option key={theme.name} value={theme.name}>
              {theme.name}
            </option>
          ))}
        </select>
      </InputGroup>

      <div className={classes.SectionLabel}>Setting overrides</div>
      <p className={classes.Hint}>
        Checked settings override the global config while this profile is
        active.
      </p>

      {OVERRIDABLE_FIELDS.map((field) => {
        const enabled = Object.prototype.hasOwnProperty.call(
          overrides,
          field.key
        );
        const value = (overrides as Record<string, unknown>)[field.key];

        return (
          <div key={field.key} className={classes.OverrideRow}>
            <label className={classes.OverrideToggle}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) =>
                  toggleOverrideKey(field.key, e.target.checked)
                }
              />
              <span>{field.label}</span>
            </label>

            {enabled && field.control.kind === 'bool' && (
              <select
                value={value ? 1 : 0}
                onChange={(e) =>
                  setOverride(field.key, e.target.value === '1')
                }
              >
                <option value={0}>Off</option>
                <option value={1}>On</option>
              </select>
            )}

            {enabled && field.control.kind === 'text' && (
              <input
                type="text"
                placeholder={field.control.placeholder}
                value={(value as string) ?? ''}
                onChange={(e) => setOverride(field.key, e.target.value)}
              />
            )}

            {enabled && field.control.kind === 'select' && (
              <select
                value={(value as string) ?? ''}
                onChange={(e) => setOverride(field.key, e.target.value)}
              >
                {field.control.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      })}

      <div className={classes.SectionLabel}>Auto-activation rules</div>
      <RulesEditor
        rules={form.rules}
        onChange={(rules: ProfileRule[]) => setForm({ ...form, rules })}
      />

      <div className={classes.FormActions}>
        <Button>{profile ? 'Save profile' : 'Create profile'}</Button>
        <span className={classes.Cancel} onClick={onDone}>
          Cancel
        </span>
      </div>
    </form>
  );
};
