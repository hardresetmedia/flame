import { Profile, ProfileRule } from '../interfaces';
import { DeviceSignals } from './deviceSignals';
import { ipMatchesAny } from './cidr';

export interface RuleContext {
  signals: DeviceSignals;
  ip: string | null;
  // minutes since midnight (local), 0..1439
  minutesOfDay: number;
  // 0 = Sunday .. 6 = Saturday
  dayOfWeek: number;
}

const toMinutes = (hhmm: string): number | null => {
  const match = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
};

// A time window matches if now is within [from, to). from > to wraps past
// midnight (e.g. 18:00 -> 07:00 covers the evening and early morning).
const timeMatches = (
  window: { from: string; to: string },
  minutesOfDay: number
): boolean => {
  const from = toMinutes(window.from);
  const to = toMinutes(window.to);
  if (from === null || to === null) return false;

  if (from === to) return true; // full-day window
  if (from < to) return minutesOfDay >= from && minutesOfDay < to;
  // wraps midnight
  return minutesOfDay >= from || minutesOfDay < to;
};

// Every present condition must pass (AND); absent/null conditions are ignored.
// A null signal (e.g. batteryPresent unknown) never satisfies a condition
// that tests it — so a rule requiring a signal the browser can't provide
// simply won't match, rather than throwing.
export const ruleMatches = (
  rule: ProfileRule,
  ctx: RuleContext
): boolean => {
  const c = rule.conditions || {};
  const { signals } = ctx;

  if (c.deviceClass && c.deviceClass.length) {
    if (!c.deviceClass.includes(signals.deviceClass as never)) return false;
  }

  if (c.viewport) {
    const { minWidth, maxWidth } = c.viewport;
    if (minWidth != null && signals.viewport.width < minWidth) return false;
    if (maxWidth != null && signals.viewport.width > maxWidth) return false;
  }

  if (c.touch != null) {
    if (signals.touch !== c.touch) return false;
  }

  if (c.batteryPresent != null) {
    // unknown battery state can't satisfy a battery condition
    if (signals.batteryPresent !== c.batteryPresent) return false;
  }

  if (c.timeOfDay) {
    if (!timeMatches(c.timeOfDay, ctx.minutesOfDay)) return false;
  }

  if (c.daysOfWeek && c.daysOfWeek.length) {
    if (!c.daysOfWeek.includes(ctx.dayOfWeek)) return false;
  }

  if (c.ipCidrs && c.ipCidrs.length) {
    if (!ipMatchesAny(ctx.ip, c.ipCidrs)) return false;
  }

  return true;
};

// A profile matches if ANY of its rules matches (OR). A profile with no
// rules never auto-activates (it can still be selected by URL/default).
export const profileMatches = (
  profile: Profile,
  ctx: RuleContext
): boolean => {
  const rules = profile.rules || [];
  return rules.some((rule) => ruleMatches(rule, ctx));
};

// Returns the first profile (in the given precedence order) whose rules
// match, or null. Callers pass profiles already ordered by orderId, so
// drag-order in the settings UI IS the rule precedence.
export const evaluateRules = (
  profiles: Profile[],
  ctx: RuleContext
): Profile | null => {
  for (const profile of profiles) {
    if (profileMatches(profile, ctx)) return profile;
  }
  return null;
};
