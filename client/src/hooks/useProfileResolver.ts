// Decides which profile is active. Mounted once in App.tsx; re-resolves on
// boot (once profiles + config have loaded), on every hashchange, and when
// the profiles list changes. Precedence:
//   explicit #!/name in the URL
//   > matched auto-activation rule   (Phase: rules engine)
//   > remembered explicit choice     (localStorage.lastProfile)
//   > the isDefault profile
//   > base view (no profile)
// A remembered choice sits BELOW rules on purpose: rules encode per-device/
// time intent and must not be permanently shadowed by one stale manual pick.
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';
import { State } from '../store/reducers';
import { actionCreators } from '../store';
import { parseProfileHash } from '../utility';

export const LAST_PROFILE_KEY = 'lastProfile';

export const useProfileResolver = (): void => {
  const { profiles, loaded: profilesLoaded } = useSelector(
    (state: State) => state.profiles
  );
  const { loading: configLoading } = useSelector(
    (state: State) => state.config
  );
  const { themes, userThemes } = useSelector((state: State) => state.theme);

  const dispatch = useDispatch();
  const { setActiveProfile, createNotification } = bindActionCreators(
    actionCreators,
    dispatch
  );

  const resolve = () => {
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

    // 2. rules (added by the rules engine phase; see utility/rulesEngine.ts)

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
    // (for per-profile theme names).
    if (!profilesLoaded || configLoading) {
      return;
    }

    resolve();

    // live switching: editing the hash re-resolves without a reload
    window.addEventListener('hashchange', resolve);
    return () => window.removeEventListener('hashchange', resolve);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilesLoaded, configLoading, profiles, themes, userThemes]);
};
