import { Dispatch } from 'redux';
import { ApiResponse } from '../../interfaces';
import { ActionType } from '../action-types';
import {
  AuthErrorAction,
  AutoLoginAction,
  LoginAction,
  LogoutAction,
} from '../actions/auth';
import axios, { AxiosError } from 'axios';
// getConfig is re-dispatched on every auth change: the server returns the
// full config only to authenticated clients (secrets are redacted for
// anonymous ones), so the cached copy must be refreshed after login/logout.
import { getApps, getCategories, getConfig } from '.';

export const login =
  (formData: { password: string; duration: string }) =>
  async (dispatch: Dispatch<LoginAction>) => {
    try {
      const res = await axios.post<ApiResponse<{ token: string }>>(
        '/api/auth',
        formData
      );

      localStorage.setItem('token', res.data.data.token);

      dispatch({
        type: ActionType.login,
        payload: res.data.data.token,
      });

      dispatch<any>(getApps());
      dispatch<any>(getCategories());
      dispatch<any>(getConfig());
    } catch (err) {
      dispatch<any>(authError(err, true));
    }
  };

export const logout = () => (dispatch: Dispatch<LogoutAction>) => {
  localStorage.removeItem('token');

  dispatch({
    type: ActionType.logout,
  });

  dispatch<any>(getApps());
  dispatch<any>(getCategories());
  dispatch<any>(getConfig());
};

export const autoLogin = () => async (dispatch: Dispatch<AutoLoginAction>) => {
  const token: string = localStorage.token;

  try {
    await axios.post<ApiResponse<{ token: { isValid: boolean } }>>(
      '/api/auth/validate',
      { token }
    );

    dispatch({
      type: ActionType.autoLogin,
      payload: token,
    });

    dispatch<any>(getApps());
    dispatch<any>(getCategories());
    dispatch<any>(getConfig());
  } catch (err) {
    dispatch<any>(authError(err, false));
  }
};

export const authError =
  (error: unknown, showNotification: boolean) =>
  (dispatch: Dispatch<AuthErrorAction>) => {
    const apiError = error as AxiosError;

    if (showNotification) {
      dispatch<any>({
        type: ActionType.createNotification,
        payload: {
          title: 'Error',
          message: apiError.response?.data.error,
        },
      });
    }

    dispatch<any>(getApps());
    dispatch<any>(getCategories());
  };
