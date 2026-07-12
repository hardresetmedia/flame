import { NavLink, Link, Routes, Route } from 'react-router-dom';

// Redux
import { useSelector } from 'react-redux';
import { State } from '../../store/reducers';

// Typescript
import { Route as SettingsRoute } from '../../interfaces';

// CSS
import classes from './Settings.module.css';

// Components
import { Themer } from './Themer/Themer';
import { WeatherSettings } from './WeatherSettings/WeatherSettings';
import { UISettings } from './UISettings/UISettings';
import { AppDetails } from './AppDetails/AppDetails';
import { StyleSettings } from './StyleSettings/StyleSettings';
import { GeneralSettings } from './GeneralSettings/GeneralSettings';
import { DockerSettings } from './DockerSettings/DockerSettings';
import { ProtectedRoute } from '../Routing/ProtectedRoute';

// UI
import { Container, Headline } from '../UI';

// Data
import clientRoutes from './settings.json';

export const Settings = (): JSX.Element => {
  const routes = clientRoutes.routes;

  const { isAuthenticated } = useSelector((state: State) => state.auth);

  const tabs = isAuthenticated ? routes : routes.filter((r) => !r.authRequired);

  return (
    <Container>
      <Headline title="Settings" subtitle={<Link to="/">Go back</Link>} />
      <div className={classes.Settings}>
        {/* NAVIGATION MENU */}
        <nav className={classes.SettingsNav}>
          {tabs.map(({ name, dest }: SettingsRoute, idx) => (
            <NavLink
              className={({ isActive }) =>
                isActive
                  ? `${classes.SettingsNavLink} ${classes.SettingsNavLinkActive}`
                  : classes.SettingsNavLink
              }
              end
              to={dest}
              key={idx}
            >
              {name}
            </NavLink>
          ))}
        </nav>

        {/* ROUTES */}
        <section className={classes.SettingsContent}>
          {/* Relative to the parent "/settings/*" route in App.tsx */}
          <Routes>
            <Route index element={<Themer />} />
            <Route
              path="weather"
              element={
                <ProtectedRoute>
                  <WeatherSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="general"
              element={
                <ProtectedRoute>
                  <GeneralSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="interface"
              element={
                <ProtectedRoute>
                  <UISettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="docker"
              element={
                <ProtectedRoute>
                  <DockerSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="css"
              element={
                <ProtectedRoute>
                  <StyleSettings />
                </ProtectedRoute>
              }
            />
            <Route path="app" element={<AppDetails />} />
          </Routes>
        </section>
      </div>
    </Container>
  );
};
