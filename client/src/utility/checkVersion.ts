import { store } from '../store/store';
import { createNotification } from '../store/action-creators';

// Upstream Flame phoned home to pawelmalak/flame on GitHub to compare
// version strings. This fork has diverged from the (dormant) upstream, so
// the remote check is gone; the forced path (the settings-page button)
// still gives feedback instead of silently doing nothing.
export const checkVersion = async (isForced: boolean = false) => {
  if (isForced) {
    store.dispatch<any>(
      createNotification({
        title: 'Info',
        message: 'Upstream version checks are disabled in this fork',
      })
    );
  }
};
