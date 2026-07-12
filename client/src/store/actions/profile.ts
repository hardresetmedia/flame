import { ActionType } from '../action-types';
import { Profile, ProfileSource } from '../../interfaces';

export interface GetProfilesAction {
  type: ActionType.getProfiles;
  payload: undefined;
}

export interface GetProfilesSuccessAction {
  type: ActionType.getProfilesSuccess;
  payload: Profile[];
}

export interface GetProfilesErrorAction {
  type: ActionType.getProfilesError;
  payload: undefined;
}

export interface AddProfileAction {
  type: ActionType.addProfile;
  payload: Profile;
}

export interface UpdateProfileAction {
  type: ActionType.updateProfile;
  payload: Profile;
}

export interface DeleteProfileAction {
  type: ActionType.deleteProfile;
  payload: number;
}

export interface ReorderProfilesAction {
  type: ActionType.reorderProfiles;
  payload: Profile[];
}

export interface SetActiveProfileAction {
  type: ActionType.setActiveProfile;
  payload: {
    id: number | null;
    name: string | null;
    source: ProfileSource;
  };
}

export interface SetClientIpAction {
  type: ActionType.setClientIp;
  payload: string | null;
}
