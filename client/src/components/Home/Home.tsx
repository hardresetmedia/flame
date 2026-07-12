import { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { State } from '../../store/reducers';
import { bindActionCreators } from 'redux';
import { actionCreators } from '../../store';

// Typescript
import { App, Category } from '../../interfaces';

// UI
import { Icon, Container, SectionHeadline, Spinner, Message } from '../UI';

// CSS
import classes from './Home.module.css';

// Components
import { AppGrid } from '../Apps/AppGrid/AppGrid';
import { BookmarkGrid } from '../Bookmarks/BookmarkGrid/BookmarkGrid';
import { SearchBar } from '../SearchBar/SearchBar';
import { Header } from './Header/Header';

// Utils
import { escapeRegex, visibleInProfile } from '../../utility';

export const Home = (): JSX.Element => {
  const {
    apps: { apps, loading: appsLoading },
    bookmarks: { categories, loading: bookmarksLoading },
    config: { config },
    auth: { isAuthenticated },
    profiles: { activeProfileId },
  } = useSelector((state: State) => state);

  // Profile filtering happens at render time (same pattern as isPinned):
  // switching profiles is a pure state change, no refetch needed.
  const visibleApps = apps.filter((app) =>
    visibleInProfile(app, activeProfileId)
  );
  const visibleCategories = categories.filter((category) =>
    visibleInProfile(category, activeProfileId)
  );

  const dispatch = useDispatch();
  const { getApps, getCategories } = bindActionCreators(
    actionCreators,
    dispatch
  );

  // Local search query
  const [localSearch, setLocalSearch] = useState<null | string>(null);
  const [appSearchResult, setAppSearchResult] = useState<null | App[]>(null);
  const [bookmarkSearchResult, setBookmarkSearchResult] = useState<
    null | Category[]
  >(null);

  // Load applications
  useEffect(() => {
    if (!apps.length) {
      getApps();
    }
  }, []);

  // Load bookmark categories
  useEffect(() => {
    if (!categories.length) {
      getCategories();
    }
  }, []);

  useEffect(() => {
    if (localSearch) {
      // Search through apps (within the active profile)
      setAppSearchResult([
        ...visibleApps.filter(({ name, description }) =>
          new RegExp(escapeRegex(localSearch), 'i').test(
            `${name} ${description}`
          )
        ),
      ]);

      // Search through bookmarks (within the active profile)
      const category = { ...visibleCategories[0] };

      category.name = 'Search Results';
      category.bookmarks = visibleCategories
        .map(({ bookmarks }) => bookmarks)
        .flat()
        .filter(({ name }) =>
          new RegExp(escapeRegex(localSearch), 'i').test(name)
        );

      setBookmarkSearchResult([category]);
    } else {
      setAppSearchResult(null);
      setBookmarkSearchResult(null);
    }
  }, [localSearch, activeProfileId]);

  return (
    <Container>
      {!config.hideSearch ? (
        <SearchBar
          setLocalSearch={setLocalSearch}
          appSearchResult={appSearchResult}
          bookmarkSearchResult={bookmarkSearchResult}
        />
      ) : (
        <div></div>
      )}

      <Header />

      {!isAuthenticated &&
      !visibleApps.some((a) => a.isPinned) &&
      !visibleCategories.some((c) => c.isPinned) ? (
        <Message>
          Welcome to Flame! Go to <Link to="/settings/app">/settings</Link>,
          login and start customizing your new homepage
        </Message>
      ) : (
        <></>
      )}

      {!config.hideApps &&
      (isAuthenticated || visibleApps.some((a) => a.isPinned)) ? (
        <Fragment>
          <SectionHeadline title="Applications" link="/applications" />
          {appsLoading ? (
            <Spinner />
          ) : (
            <AppGrid
              apps={
                !appSearchResult
                  ? visibleApps.filter(({ isPinned }) => isPinned)
                  : appSearchResult
              }
              totalApps={visibleApps.length}
              searching={!!localSearch}
            />
          )}
          <div className={classes.HomeSpace}></div>
        </Fragment>
      ) : (
        <></>
      )}

      {!config.hideCategories &&
      (isAuthenticated || visibleCategories.some((c) => c.isPinned)) ? (
        <Fragment>
          <SectionHeadline title="Bookmarks" link="/bookmarks" />
          {bookmarksLoading ? (
            <Spinner />
          ) : (
            <BookmarkGrid
              categories={
                !bookmarkSearchResult
                  ? visibleCategories.filter(
                      ({ isPinned, bookmarks }) => isPinned && bookmarks.length
                    )
                  : bookmarkSearchResult
              }
              totalCategories={visibleCategories.length}
              searching={!!localSearch}
              fromHomepage={true}
            />
          )}
        </Fragment>
      ) : (
        <></>
      )}

      <Link to="/settings" className={classes.SettingsButton}>
        <Icon icon="mdiCog" color="var(--color-background)" />
      </Link>
    </Container>
  );
};
