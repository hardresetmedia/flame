import classes from './Icon.module.css';

import { Icon as MDIcon } from '@mdi/react';
// Namespace import instead of CRA-era require(): icons are looked up by
// name at runtime, so the whole set is bundled either way.
import * as MDIcons from '@mdi/js';

interface Props {
  icon: string;
  color?: string;
}

export const Icon = (props: Props): JSX.Element => {
  let iconPath = (MDIcons as Record<string, string>)[props.icon];

  if (!iconPath) {
    console.log(`Icon ${props.icon} not found`);
    iconPath = MDIcons.mdiCancel;
  }

  return (
    <MDIcon
      className={classes.Icon}
      path={iconPath}
      color={props.color ? props.color : 'var(--color-primary)'}
    />
  );
};
