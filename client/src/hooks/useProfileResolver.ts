// Decides which profile is active. Mounted once in App.tsx; re-resolves on
// boot (once profiles + config have loaded), on every hashchange, and when
// the profiles list changes. Precedence:
//   explicit #!/name in the URL
//   > matched auto-activation rule
//   > remembered explicit choice     (localStorage.lastProfile)
//   > the isDefault profile
//   > base view (no profile)
// A remembered choice sits BELOW rules on purpose: rules encode per-device/
// time intent and must not be permanently shadowed by one stale manual pick.
//
// Rules are evaluated ONCE per resolution (boot / hashchange), not on resize
// or a clock tick — a startpage that rearranges itself mid-session is worse
// than one that is stale until the next reload.
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';
import { State } from '../store/reducers';
import { actionCreators } from '../store';
import { parseProfileHash } from '../utility';
import { getDeviceSignals, DeviceSignals } from '../utility/deviceSignals';
import { evaluateRules, RuleContext } from '../utility/rulesEngine';

export const LAST_PROFILE_KEY = 'lastProfile';

export const useProfileResolver = (): void => {
  const {
    profiles,
    loaded: profilesLoaded,
    clientIp,
  } = useSelector((state: State) => state.profiles);
  const { loading: configLoading } = useSelector(
    (state: State) => state.config
  );
  const { themes, userThemes } = useSelector((state: State) => state.theme);

  const dispatch = useDispatch();
  const { setActiveProfile, createNotification } = bindActionCreators(
    actionCreators,
    dispatch
  );

  // Device signals are measured once and cached — they don't change within a
  // session in a way we act on (see the no-resize-re-eval note above).
  const signalsRef = useRef<DeviceSignals | null>(null);

  const resolve = async () => {
    const hashName = parseProfileHash();

    // 1. explicit hash
    if (hashName !== null) {
      if (hashName === '') {
        // '#!/' = explicit clear: forget the remembered profile
        localStorage.removeItem(LAST_PROFILE_KEY);
        setActiveProfile(null, 'none');
        return;
      }

      const fromHash = profiles.find((p) => p.name === hashName);

      if (fromHash) {
        localStorage.setItem(LAST_PROFILE_KEY, fromHash.name);
        setActiveProfile(fromHash, 'hash');
        return;
      }

      createNotification({
        title: 'Info',
        message: `Profile '${hashName}' does not exist`,
      });
      // fall through to the rest of the chain
    }

    // 2. auto-activation rules
    if (!signalsRef.current) {
      signalsRef.current = await getDeviceSignals();
    }
    const now = new Date();
    const ctx: RuleContext = {
      signals: signalsRef.current,
      ip: clientIp,
      minutesOfDay: now.getHours() * 60 + now.getMinutes(),
      dayOfWeek: now.getDay(),
    };
    const ruled = evaluateRules(profiles, ctx);
    if (ruled) {
      setActiveProfile(ruled, 'rule');
      return;
    }

    // 3. remembered explicit choice
    const remembered = localStorage.getItem(LAST_PROFILE_KEY);

    if (remembered) {
      const fromMemory = profiles.find((p) => p.name === remembered);

      if (fromMemory) {
        setActiveProfile(fromMemory, 'remembered');
        return;
      }

      // profile was deleted since — clean up the stale key
      localStorage.removeItem(LAST_PROFILE_KEY);
    }

    // 4. default profile
    const defaultProfile = profiles.find((p) => p.isDefault);

    if (defaultProfile) {
      setActiveProfile(defaultProfile, 'default');
      return;
    }

    // 5. base view
    setActiveProfile(null, 'none');
  };

  useEffect(() => {
    // Wait for everything a profile controls to be loadable: the profile
    // list, the base config (for title/theme fallbacks) and the theme list
    // (for per-profile theme names). clientIp is allowed to still be null —
    // IP rules just won't match until it arrives, and the profiles-change
    // dependency re-resolves once it does (setClientIp doesn't retrigger, so
    // IP-only rules resolve on the next profiles update or hashchange; for a
    // startpage that's acceptable, and the hints call is fast).
    if (!profilesLoaded || configLoading) {
      return;
    }

    resolve();

    // live switching: editing the hash re-resolves without a reload
    const onHashChange = () => resolve();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilesLoaded, configLoading, profiles, themes, userThemes, clientIp]);
};
