import { describe, it, expect } from 'vitest';
import { ruleMatches, evaluateRules, RuleContext } from './rulesEngine';
import { Profile, ProfileRule } from '../interfaces';

const baseCtx: RuleContext = {
  signals: {
    deviceClass: 'laptop',
    touch: false,
    viewport: { width: 1400, height: 900 },
    batteryPresent: true,
  },
  ip: '192.168.1.50',
  minutesOfDay: 10 * 60, // 10:00
  dayOfWeek: 3, // Wednesday
};

const rule = (conditions: ProfileRule['conditions']): ProfileRule => ({
  conditions,
});

describe('ruleMatches — single conditions', () => {
  it('empty conditions always match', () => {
    expect(ruleMatches(rule({}), baseCtx)).toBe(true);
  });

  it('deviceClass', () => {
    expect(ruleMatches(rule({ deviceClass: ['laptop'] }), baseCtx)).toBe(true);
    expect(ruleMatches(rule({ deviceClass: ['phone'] }), baseCtx)).toBe(false);
    expect(
      ruleMatches(rule({ deviceClass: ['phone', 'laptop'] }), baseCtx)
    ).toBe(true);
  });

  it('viewport min/max', () => {
    expect(ruleMatches(rule({ viewport: { maxWidth: 900 } }), baseCtx)).toBe(
      false
    );
    expect(ruleMatches(rule({ viewport: { minWidth: 1000 } }), baseCtx)).toBe(
      true
    );
    expect(
      ruleMatches(rule({ viewport: { minWidth: 1000, maxWidth: 1500 } }), baseCtx)
    ).toBe(true);
  });

  it('touch and battery tri-state', () => {
    expect(ruleMatches(rule({ touch: false }), baseCtx)).toBe(true);
    expect(ruleMatches(rule({ touch: true }), baseCtx)).toBe(false);
    expect(ruleMatches(rule({ batteryPresent: true }), baseCtx)).toBe(true);
    expect(ruleMatches(rule({ batteryPresent: false }), baseCtx)).toBe(false);
  });

  it('a null signal never satisfies a condition testing it', () => {
    const ctx: RuleContext = {
      ...baseCtx,
      signals: { ...baseCtx.signals, batteryPresent: null },
    };
    expect(ruleMatches(rule({ batteryPresent: true }), ctx)).toBe(false);
    expect(ruleMatches(rule({ batteryPresent: false }), ctx)).toBe(false);
  });

  it('daysOfWeek', () => {
    expect(ruleMatches(rule({ daysOfWeek: [3] }), baseCtx)).toBe(true);
    expect(ruleMatches(rule({ daysOfWeek: [0, 6] }), baseCtx)).toBe(false);
  });

  it('ipCidrs', () => {
    expect(ruleMatches(rule({ ipCidrs: ['192.168.1.0/24'] }), baseCtx)).toBe(
      true
    );
    expect(ruleMatches(rule({ ipCidrs: ['10.0.0.0/8'] }), baseCtx)).toBe(false);
  });
});

describe('ruleMatches — time windows', () => {
  it('normal window', () => {
    expect(
      ruleMatches(rule({ timeOfDay: { from: '09:00', to: '17:00' } }), baseCtx)
    ).toBe(true);
    expect(
      ruleMatches(rule({ timeOfDay: { from: '11:00', to: '17:00' } }), baseCtx)
    ).toBe(false);
  });

  it('window wrapping past midnight', () => {
    // 18:00 -> 07:00; 10:00 (baseCtx) is outside
    expect(
      ruleMatches(rule({ timeOfDay: { from: '18:00', to: '07:00' } }), baseCtx)
    ).toBe(false);

    const evening: RuleContext = { ...baseCtx, minutesOfDay: 20 * 60 };
    const earlyMorning: RuleContext = { ...baseCtx, minutesOfDay: 5 * 60 };
    expect(
      ruleMatches(rule({ timeOfDay: { from: '18:00', to: '07:00' } }), evening)
    ).toBe(true);
    expect(
      ruleMatches(
        rule({ timeOfDay: { from: '18:00', to: '07:00' } }),
        earlyMorning
      )
    ).toBe(true);
  });
});

describe('ruleMatches — AND across conditions', () => {
  it('all present conditions must pass', () => {
    const good = rule({
      deviceClass: ['laptop'],
      viewport: { minWidth: 1000 },
      ipCidrs: ['192.168.1.0/24'],
    });
    expect(ruleMatches(good, baseCtx)).toBe(true);

    const oneFails = rule({
      deviceClass: ['laptop'],
      ipCidrs: ['10.0.0.0/8'], // wrong network
    });
    expect(ruleMatches(oneFails, baseCtx)).toBe(false);
  });
});

describe('evaluateRules — OR across rules and precedence', () => {
  const makeProfile = (
    id: number,
    orderId: number,
    rules: ProfileRule[]
  ): Profile => ({
    id,
    orderId,
    name: `p${id}`,
    isDefault: false,
    theme: null,
    overrides: null,
    rules,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('a profile matches if ANY of its rules match', () => {
    const profile = makeProfile(1, 1, [
      rule({ deviceClass: ['phone'] }), // no
      rule({ deviceClass: ['laptop'] }), // yes
    ]);
    expect(evaluateRules([profile], baseCtx)?.id).toBe(1);
  });

  it('returns the first matching profile in the given order', () => {
    const first = makeProfile(1, 1, [rule({ deviceClass: ['laptop'] })]);
    const second = makeProfile(2, 2, [rule({ viewport: { minWidth: 1000 } })]);
    // both match; order decides
    expect(evaluateRules([first, second], baseCtx)?.id).toBe(1);
    expect(evaluateRules([second, first], baseCtx)?.id).toBe(2);
  });

  it('a profile with no rules never auto-activates', () => {
    const noRules = makeProfile(1, 1, []);
    expect(evaluateRules([noRules], baseCtx)).toBeNull();
  });

  it('returns null when nothing matches', () => {
    const profile = makeProfile(1, 1, [rule({ deviceClass: ['phone'] })]);
    expect(evaluateRules([profile], baseCtx)).toBeNull();
  });
});
