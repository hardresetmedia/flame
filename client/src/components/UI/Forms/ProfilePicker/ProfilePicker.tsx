import { useSelector } from 'react-redux';
import { State } from '../../../../store/reducers';
import { InputGroup } from '../..';
import classes from './ProfilePicker.module.css';

interface Props {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

// Checkbox group for assigning an app/category to profiles. No selection
// means "visible in every profile" (stated explicitly for the user).
export const ProfilePicker = ({ selectedIds, onChange }: Props): JSX.Element => {
  const { profiles } = useSelector((state: State) => state.profiles);

  if (!profiles.length) {
    return (
      <InputGroup>
        <label>Profiles</label>
        <span>
          No profiles yet. Create some under Settings → Profiles to scope
          where this item appears.
        </span>
      </InputGroup>
    );
  }

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selected) => selected !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <InputGroup>
      <label>Profiles</label>
      <div className={classes.ProfilePicker}>
        {profiles.map((profile) => (
          <label key={profile.id} className={classes.ProfileOption}>
            <input
              type="checkbox"
              checked={selectedIds.includes(profile.id)}
              onChange={() => toggle(profile.id)}
            />
            <span>{profile.name}</span>
          </label>
        ))}
      </div>
      <span>
        Leave all unchecked to show this in <strong>every</strong> profile.
      </span>
    </InputGroup>
  );
};
