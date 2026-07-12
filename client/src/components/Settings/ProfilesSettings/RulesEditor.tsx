import { DeviceClass, ProfileRule } from '../../../interfaces';
import { Button } from '../../UI';
import classes from './ProfilesSettings.module.css';

interface Props {
  rules: ProfileRule[];
  onChange: (rules: ProfileRule[]) => void;
}

const DEVICE_CLASSES: DeviceClass[] = ['phone', 'tablet', 'laptop', 'desktop'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const emptyRule: ProfileRule = { conditions: {} };

// Editor for a profile's auto-activation rules. Every condition is optional;
// present conditions are AND-ed, and multiple rules are OR-ed (semantics
// enforced by utility/rulesEngine.ts). This component only edits the JSON —
// evaluation and the live "which profile wins" readout live in the resolver.
export const RulesEditor = ({ rules, onChange }: Props): JSX.Element => {
  const updateRule = (index: number, conditions: ProfileRule['conditions']) => {
    onChange(rules.map((rule, i) => (i === index ? { conditions } : rule)));
  };

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  const moveRule = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= rules.length) return;
    const next = [...rules];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className={classes.RulesEditor}>
      {rules.length === 0 && (
        <p className={classes.Hint}>
          No rules. Add one to auto-activate this profile by device, screen
          size, time or network.
        </p>
      )}

      {rules.map((rule, index) => {
        const c = rule.conditions;

        const toggleDevice = (device: DeviceClass) => {
          const current = c.deviceClass ?? [];
          const next = current.includes(device)
            ? current.filter((d) => d !== device)
            : [...current, device];
          updateRule(index, {
            ...c,
            deviceClass: next.length ? next : null,
          });
        };

        const toggleDay = (day: number) => {
          const current = c.daysOfWeek ?? [];
          const next = current.includes(day)
            ? current.filter((d) => d !== day)
            : [...current, day];
          updateRule(index, {
            ...c,
            daysOfWeek: next.length ? next : null,
          });
        };

        return (
          <div key={index} className={classes.Rule}>
            <div className={classes.RuleHeader}>
              <strong>Rule {index + 1}</strong>
              <div className={classes.RuleControls}>
                <span onClick={() => moveRule(index, -1)}>↑</span>
                <span onClick={() => moveRule(index, 1)}>↓</span>
                <span onClick={() => removeRule(index)}>✕</span>
              </div>
            </div>

            {/* device class */}
            <div className={classes.RuleField}>
              <label>Device class</label>
              <div className={classes.Chips}>
                {DEVICE_CLASSES.map((device) => (
                  <label key={device} className={classes.Chip}>
                    <input
                      type="checkbox"
                      checked={(c.deviceClass ?? []).includes(device)}
                      onChange={() => toggleDevice(device)}
                    />
                    <span>{device}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* viewport */}
            <div className={classes.RuleField}>
              <label>Viewport width (px)</label>
              <div className={classes.Inline}>
                <input
                  type="number"
                  placeholder="min"
                  value={c.viewport?.minWidth ?? ''}
                  onChange={(e) =>
                    updateRule(index, {
                      ...c,
                      viewport: {
                        ...(c.viewport ?? { minWidth: null, maxWidth: null }),
                        minWidth: e.target.value
                          ? Number(e.target.value)
                          : null,
                      },
                    })
                  }
                />
                <input
                  type="number"
                  placeholder="max"
                  value={c.viewport?.maxWidth ?? ''}
                  onChange={(e) =>
                    updateRule(index, {
                      ...c,
                      viewport: {
                        ...(c.viewport ?? { minWidth: null, maxWidth: null }),
                        maxWidth: e.target.value
                          ? Number(e.target.value)
                          : null,
                      },
                    })
                  }
                />
              </div>
            </div>

            {/* touch + battery (tri-state) */}
            <div className={classes.RuleField}>
              <label>Touchscreen</label>
              <select
                value={c.touch == null ? '' : c.touch ? 'yes' : 'no'}
                onChange={(e) =>
                  updateRule(index, {
                    ...c,
                    touch: e.target.value === '' ? null : e.target.value === 'yes',
                  })
                }
              >
                <option value="">Ignore</option>
                <option value="yes">Required</option>
                <option value="no">Must be absent</option>
              </select>
            </div>

            <div className={classes.RuleField}>
              <label>Battery present (laptop vs desktop)</label>
              <select
                value={
                  c.batteryPresent == null ? '' : c.batteryPresent ? 'yes' : 'no'
                }
                onChange={(e) =>
                  updateRule(index, {
                    ...c,
                    batteryPresent:
                      e.target.value === '' ? null : e.target.value === 'yes',
                  })
                }
              >
                <option value="">Ignore</option>
                <option value="yes">Has battery</option>
                <option value="no">No battery</option>
              </select>
            </div>

            {/* time of day */}
            <div className={classes.RuleField}>
              <label>Time of day (24h, wraps past midnight)</label>
              <div className={classes.Inline}>
                <input
                  type="time"
                  value={c.timeOfDay?.from ?? ''}
                  onChange={(e) =>
                    updateRule(index, {
                      ...c,
                      timeOfDay: e.target.value
                        ? { from: e.target.value, to: c.timeOfDay?.to ?? '23:59' }
                        : null,
                    })
                  }
                />
                <input
                  type="time"
                  value={c.timeOfDay?.to ?? ''}
                  onChange={(e) =>
                    updateRule(index, {
                      ...c,
                      timeOfDay: e.target.value
                        ? { from: c.timeOfDay?.from ?? '00:00', to: e.target.value }
                        : null,
                    })
                  }
                />
              </div>
            </div>

            {/* days of week */}
            <div className={classes.RuleField}>
              <label>Days of week</label>
              <div className={classes.Chips}>
                {DAYS.map((day, dayIndex) => (
                  <label key={day} className={classes.Chip}>
                    <input
                      type="checkbox"
                      checked={(c.daysOfWeek ?? []).includes(dayIndex)}
                      onChange={() => toggleDay(dayIndex)}
                    />
                    <span>{day}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* IP CIDRs */}
            <div className={classes.RuleField}>
              <label>Client IP / CIDR (comma-separated)</label>
              <input
                type="text"
                placeholder="192.168.1.0/24, 10.0.0.5"
                value={(c.ipCidrs ?? []).join(', ')}
                onChange={(e) => {
                  const list = e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  updateRule(index, {
                    ...c,
                    ipCidrs: list.length ? list : null,
                  });
                }}
              />
            </div>
          </div>
        );
      })}

      <span
        className={classes.AddRule}
        onClick={() => onChange([...rules, { ...emptyRule }])}
      >
        + Add rule
      </span>
    </div>
  );
};
