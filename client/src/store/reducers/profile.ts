import { Action } from '../actions';
import { ActionType } from '../action-types';
import { Profile, ProfileSource } from '../../interfaces';

interface ProfilesState {
  profiles: Profile[];
  loading: boolean;
  loaded: boolean;
  activeProfileId: number | null;
  activeProfileName: string | null;
  activeSource: ProfileSource;
  // server-reported client IP (/api/client-hints) for CIDR rules
  clientIp: string | null;
}

const initialState: ProfilesState = {
  profiles: [],
  loading: true,
  loaded: false,
  activeProfileId: null,
  activeProfileName: null,
  activeSource: 'none',
  clientIp: null,
};

const byOrder = (a: Profile, b: Profile) =>
  (a.orderId ?? Number.MAX_SAFE_INTEGER) - (b.orderId ?? Number.MAX_SAFE_INTEGER);

export const profilesReducer = (
  state: ProfilesState = initialState,
  action: Action
): ProfilesState => {
  switch (action.type) {
    case ActionType.getProfiles:
      return { ...state, loading: true };

    case ActionType.getProfilesSuccess:
      return {
        ...state,
        loading: false,
        loaded: true,
        profiles: [...action.payload].sort(byOrder),
      };

    case ActionType.getProfilesError:
      // loaded=true so the resolver still runs (base view) if the fetch fails
      return { ...state, loading: false, loaded: true };

    case ActionType.addProfile:
      return {
        ...state,
        profiles: [...state.profiles, action.payload].sort(byOrder),
      };

    case ActionType.updateProfile:
      return {
        ...state,
        profiles: state.profiles
          .map((p) => (p.id === action.payload.id ? action.payload : p))
          .sort(byOrder),
      };

    case ActionType.deleteProfile: {
      const isActive = state.activeProfileId === action.payload;

      return {
        ...state,
        profiles: state.profiles.filter((p) => p.id !== action.payload),
        // the resolver re-resolves on profiles change; clear eagerly so a
        // deleted-but-active profile never lingers
        activeProfileId: isActive ? null : state.activeProfileId,
        activeProfileName: isActive ? null : state.activeProfileName,
        activeSource: isActive ? 'none' : state.activeSource,
      };
    }

    case ActionType.reorderProfiles:
      return { ...state, profiles: [...action.payload].sort(byOrder) };

    case ActionType.setActiveProfile:
      return {
        ...state,
        activeProfileId: action.payload.id,
        activeProfileName: action.payload.name,
        activeSource: action.payload.source,
      };

    case ActionType.setClientIp:
      return { ...state, clientIp: action.payload };

    default:
      return state;
  }
};
