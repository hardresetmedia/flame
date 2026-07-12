import { Fragment, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';

import { State } from '../../../store/reducers';
import { actionCreators } from '../../../store';
import { Profile } from '../../../interfaces';
import { SettingsHeadline, Button } from '../../UI';
import { ProfileForm } from './ProfileForm';
import classes from './ProfilesSettings.module.css';

export const ProfilesSettings = (): JSX.Element => {
  const { profiles } = useSelector((state: State) => state.profiles);

  const dispatch = useDispatch();
  const { getProfiles, deleteProfile } = bindActionCreators(
    actionCreators,
    dispatch
  );

  // null = list view; { profile } = editing (profile null -> creating)
  const [editing, setEditing] = useState<{ profile: Profile | null } | null>(
    null
  );

  useEffect(() => {
    getProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (editing) {
    return (
      <Fragment>
        <SettingsHeadline
          text={editing.profile ? `Edit ${editing.profile.name}` : 'New profile'}
        />
        <ProfileForm
          profile={editing.profile}
          onDone={() => setEditing(null)}
        />
      </Fragment>
    );
  }

  return (
    <Fragment>
      <SettingsHeadline text="Profiles" />
      <p className={classes.Intro}>
        Profiles scope which apps and bookmarks appear, and can override the
        theme and interface settings. Activate one with{' '}
        <code>#!/name</code> in the URL, or with the auto-activation rules on
        each profile.
      </p>

      {profiles.length === 0 ? (
        <p className={classes.Hint}>No profiles yet.</p>
      ) : (
        <div className={classes.ProfileList}>
          {profiles.map((profile) => (
            <div key={profile.id} className={classes.ProfileRow}>
              <div className={classes.ProfileInfo}>
                <span className={classes.ProfileName}>
                  {profile.name}
                  {profile.isDefault && (
                    <span className={classes.DefaultBadge}>default</span>
                  )}
                </span>
                <span className={classes.ProfileMeta}>
                  {profile.theme ? `theme: ${profile.theme}` : 'theme: inherit'}
                  {' · '}
                  {(profile.rules?.length ?? 0)} rule
                  {(profile.rules?.length ?? 0) === 1 ? '' : 's'}
                </span>
              </div>
              <div className={classes.ProfileActions}>
                <span onClick={() => setEditing({ profile })}>Edit</span>
                <span
                  className={classes.Danger}
                  onClick={() => {
                    if (
                      window.confirm(`Delete profile '${profile.name}'?`)
                    ) {
                      deleteProfile(profile.id);
                    }
                  }}
                >
                  Delete
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={classes.AddButton}>
        <Button click={() => setEditing({ profile: null })}>
          Add profile
        </Button>
      </div>
    </Fragment>
  );
};
