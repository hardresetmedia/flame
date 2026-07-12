import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { State } from '../../../store/reducers';
import {
  getDeviceSignals,
  DeviceSignals,
} from '../../../utility/deviceSignals';
import { evaluateRules, RuleContext } from '../../../utility/rulesEngine';
import classes from './ProfilesSettings.module.css';

// "This device, right now" panel — shows the live signals the rules engine
// sees plus which profile the current rules would auto-activate. The single
// most useful aid for debugging why a rule does (or doesn't) fire.
export const LiveDeviceReadout = (): JSX.Element => {
  const { profiles, clientIp } = useSelector((state: State) => state.profiles);
  const [signals, setSignals] = useState<DeviceSignals | null>(null);

  useEffect(() => {
    let active = true;
    getDeviceSignals().then((s) => active && setSignals(s));
    return () => {
      active = false;
    };
  }, []);

  if (!signals) {
    return <div className={classes.LiveReadout}>Reading device signals…</div>;
  }

  const now = new Date();
  const ctx: RuleContext = {
    signals,
    ip: clientIp,
    minutesOfDay: now.getHours() * 60 + now.getMinutes(),
    dayOfWeek: now.getDay(),
  };
  const winner = evaluateRules(profiles, ctx);

  const battery =
    signals.batteryPresent === null
      ? 'unknown'
      : signals.batteryPresent
      ? 'present'
      : 'absent';

  return (
    <div className={classes.LiveReadout}>
      <strong>This device right now</strong>
      <div>
        Device class: {signals.deviceClass} · touch:{' '}
        {signals.touch ? 'yes' : 'no'} · battery: {battery}
      </div>
      <div>
        Viewport: {signals.viewport.width}×{signals.viewport.height} · IP:{' '}
        {clientIp ?? 'unknown'} · {now.toLocaleTimeString()}
      </div>
      <div>
        Rules would activate:{' '}
        <strong>{winner ? winner.name : 'no profile (base view)'}</strong>
      </div>
    </div>
  );
};
