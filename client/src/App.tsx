import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import 'external-svg-loader';

// Redux
import { useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  autoLogin,
  getConfig,
  getProfiles,
  fetchClientHints,
} from './store/action-creators';
import { actionCreators, store } from './store';

// Utils
import { decodeToken, parsePABToTheme } from './utility';
import { useProfileResolver } from './hooks/useProfileResolver';

// Routes
import { Home } from './components/Home/Home';
import { Apps } from './components/Apps/Apps';
import { Settings } from './components/Settings/Settings';
import { Bookmarks } from './components/Bookmarks/Bookmarks';
import { NotificationCenter } from './components/NotificationCenter/NotificationCenter';

// Get config
store.dispatch<any>(getConfig());

// Get profiles + the client-IP hint (public endpoints; both needed before
// the profile resolver evaluates rules)
store.dispatch<any>(getProfiles());
store.dispatch<any>(fetchClientHints());

// Validate token
if (localStorage.token) {
  store.dispatch<any>(autoLogin());
}

export const App = (): JSX.Element => {
  const dispath = useDispatch();
  const { fetchQueries, setTheme, logout, createNotification, fetchThemes } =
    bindActionCreators(actionCreators, dispath);

  // Profile activation: #!/name parsing, rules, remembered choice, default.
  // Also (re)applies theme + config overrides + title on every resolution.
  useProfileResolver();

  useEffect(() => {
    // check if token is valid
    const tokenIsValid = window.setInterval(() => {
      if (localStorage.token) {
        const expiresIn = decodeToken(localStorage.token).exp * 1000;
        const now = new Date().getTime();

        if (now > expiresIn) {
          logout();
          createNotification({
            title: 'Info',
            message: 'Session expired. You have been logged out',
          });
        }
      }
    }, 1000);

    // load themes
    fetchThemes();

    // Apply the saved theme instantly on first paint to avoid a flash. The
    // profile resolver (useProfileResolver) is the single authority for the
    // *effective* theme and re-applies it — including the "no saved theme ->
    // config.defaultTheme" fallback — once profiles/config/themes settle.
    if (localStorage.theme) {
      setTheme(parsePABToTheme(localStorage.theme));
    }

    // load custom search queries
    fetchQueries();

    return () => window.clearInterval(tokenIsValid);
  }, []);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings/*" element={<Settings />} />
          {/* searching only applies to the Home-page local search; the
              full-list pages never render in that state */}
          <Route path="/applications" element={<Apps searching={false} />} />
          <Route path="/bookmarks" element={<Bookmarks searching={false} />} />
        </Routes>
      </BrowserRouter>
      <NotificationCenter />
    </>
  );
};
