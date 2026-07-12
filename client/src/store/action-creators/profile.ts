import axios, { AxiosError } from 'axios';
import { Dispatch } from 'redux';
import { ActionType } from '../action-types';
import {
  ApiResponse,
  NewProfile,
  Profile,
  ProfileSource,
} from '../../interfaces';
import { applyAuth, parsePABToTheme } from '../../utility';
import {
  GetProfilesAction,
  GetProfilesSuccessAction,
  GetProfilesErrorAction,
  AddProfileAction,
  UpdateProfileAction,
  DeleteProfileAction,
  ReorderProfilesAction,
  SetClientIpAction,
} from '../actions/profile';
import { setTheme } from './theme';
import { getApps, getCategories } from '.';
// Type-only import: used for getState in thunks, safe from require cycles
import type { State } from '../reducers';

export const getProfiles =
  () =>
  async (
    dispatch: Dispatch<
      GetProfilesAction | GetProfilesSuccessAction | GetProfilesErrorAction
    >
  ) => {
    dispatch({ type: ActionType.getProfiles, payload: undefined });

    try {
      const res = await axios.get<ApiResponse<Profile[]>>('/api/profiles');

      dispatch({
        type: ActionType.getProfilesSuccess,
        payload: res.data.data,
      });
    } catch (err) {
      console.log(err);
      dispatch({ type: ActionType.getProfilesError, payload: undefined });
    }
  };

// Fetches the server-reported client IP for profile IP/CIDR rules. Best
// effort: on failure the IP stays null and IP conditions simply never match.
export const fetchClientHints =
  () => async (dispatch: Dispatch<SetClientIpAction>) => {
    try {
      const res = await axios.get<ApiResponse<{ ip: string }>>(
        '/api/client-hints'
      );

      dispatch({
        type: ActionType.setClientIp,
        payload: res.data.data.ip,
      });
    } catch (err) {
      dispatch({ type: ActionType.setClientIp, payload: null });
    }
  };

export const addProfile =
  (formData: Partial<NewProfile>) =>
  async (dispatch: Dispatch<AddProfileAction>) => {
    try {
      const res = await axios.post<ApiResponse<Profile>>(
        '/api/profiles',
        formData,
        { headers: applyAuth() }
      );

      dispatch({
        type: ActionType.addProfile,
        payload: res.data.data,
      });

      dispatch<any>({
        type: ActionType.createNotification,
        payload: { title: 'Success', message: `Profile ${res.data.data.name} created` },
      });
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;

      dispatch<any>({
        type: ActionType.createNotification,
        payload: { title: 'Error', message: error.response?.data.error },
      });
    }
  };

export const updateProfile =
  (id: number, formData: Partial<NewProfile>) =>
  async (dispatch: Dispatch<UpdateProfileAction>) => {
    try {
      const res = await axios.put<ApiResponse<Profile>>(
        `/api/profiles/${id}`,
        formData,
        { headers: applyAuth() }
      );

      dispatch({
        type: ActionType.updateProfile,
        payload: res.data.data,
      });

      dispatch<any>({
        type: ActionType.createNotification,
        payload: { title: 'Success', message: `Profile ${res.data.data.name} updated` },
      });
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;

      dispatch<any>({
        type: ActionType.createNotification,
        payload: { title: 'Error', message: error.response?.data.error },
      });
    }
  };

export const deleteProfile =
  (id: number) => async (dispatch: Dispatch<DeleteProfileAction>) => {
    try {
      await axios.delete<ApiResponse<{}>>(`/api/profiles/${id}`, {
        headers: applyAuth(),
      });

      dispatch({
        type: ActionType.deleteProfile,
        payload: id,
      });

      // the server scrubbed this id out of app/category assignments —
      // refresh both so the local copies match
      dispatch<any>(getApps());
      dispatch<any>(getCategories());

      dispatch<any>({
        type: ActionType.createNotification,
        payload: { title: 'Success', message: 'Profile deleted' },
      });
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;

      dispatch<any>({
        type: ActionType.createNotification,
        payload: { title: 'Error', message: error.response?.data.error },
      });
    }
  };

export const reorderProfiles =
  (profiles: Profile[]) =>
  async (dispatch: Dispatch<ReorderProfilesAction>) => {
    try {
      const updatedList = profiles.map((profile, index) => ({
        ...profile,
        orderId: index + 1,
      }));

      dispatch({
        type: ActionType.reorderProfiles,
        payload: updatedList,
      });

      await axios.put<ApiResponse<{}>>(
        '/api/profiles/0/reorder',
        { profiles: updatedList.map(({ id, orderId }) => ({ id, orderId })) },
        { headers: applyAuth() }
      );
    } catch (err) {
      console.log(err);
    }
  };

export const setClientIp =
  (ip: string | null) => (dispatch: Dispatch<SetClientIpAction>) => {
    dispatch({
      type: ActionType.setClientIp,
      payload: ip,
    });
  };

// Activates a profile (or clears back to the base view with null). This is
// the single place that applies everything a profile controls: the config
// override merge, the document title and the theme.
export const setActiveProfile =
  (profile: Profile | null, source: ProfileSource) =>
  (dispatch: Dispatch<any>, getState: () => State) => {
    const {
      theme: { themes, userThemes },
      config: { baseConfig },
    } = getState();

    dispatch({
      type: ActionType.setActiveProfile,
      payload: {
        id: profile ? profile.id : null,
        name: profile ? profile.name : null,
        source,
      },
    });

    dispatch({
      type: ActionType.applyProfileOverrides,
      payload: profile ? profile.overrides : null,
    });

    // document title follows the merged config view
    const title =
      (profile && profile.overrides?.customTitle) || baseConfig.customTitle;
    if (title) {
      document.title = title;
    }

    // theme: profile theme name -> its colors; otherwise fall back to the
    // user's saved theme or the instance default. remember=false so profile
    // themes never overwrite the user's own localStorage choice.
    const namedTheme = profile?.theme
      ? [...themes, ...userThemes].find((t) => t.name === profile.theme)
      : undefined;

    if (namedTheme) {
      dispatch(setTheme(namedTheme.colors, false));
    } else {
      const basePAB: string = localStorage.theme || baseConfig.defaultTheme;
      if (basePAB) {
        dispatch(setTheme(parsePABToTheme(basePAB), false));
      }
    }
  };
