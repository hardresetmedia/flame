import { Model, Config } from '.';

export type DeviceClass = 'phone' | 'tablet' | 'laptop' | 'desktop';

// One auto-activation rule. Omitted/null conditions are ignored; all
// present conditions must match (AND). Multiple rules on a profile are OR.
// Evaluated client-side by utility/rulesEngine.ts.
export interface ProfileRule {
  conditions: {
    deviceClass?: DeviceClass[] | null;
    viewport?: { minWidth?: number | null; maxWidth?: number | null } | null;
    touch?: boolean | null;
    batteryPresent?: boolean | null;
    // 'HH:MM' 24h; from > to wraps midnight (e.g. 18:00 -> 07:00)
    timeOfDay?: { from: string; to: string } | null;
    // 0 = Sunday ... 6 = Saturday
    daysOfWeek?: number[] | null;
    // IPv4 CIDR ('192.168.1.0/24') or exact IP; matched against the
    // server-reported client IP (/api/client-hints)
    ipCidrs?: string[] | null;
  };
}

export interface NewProfile {
  name: string;
  isDefault: boolean;
  // theme *name* resolved against the themes list at activation; null = inherit
  theme: string | null;
  overrides: Partial<Config> | null;
  rules: ProfileRule[];
}

export interface Profile extends Model, NewProfile {
  orderId: number | null;
}

// How the currently-active profile was chosen (precedence order)
export type ProfileSource = 'hash' | 'rule' | 'remembered' | 'default' | 'none';
