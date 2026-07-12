import { ActionType } from '../action-types';
import { Config, Query } from '../../interfaces';

export interface GetConfigAction {
  type: ActionType.getConfig;
  payload: Config;
}

// Profiles feature: merge (or clear, with null) the active profile's
// config overrides into the derived config view
export interface ApplyProfileOverridesAction {
  type: ActionType.applyProfileOverrides;
  payload: Partial<Config> | null;
}

export interface UpdateConfigAction {
  type: ActionType.updateConfig;
  payload: Config;
}

export interface FetchQueriesAction {
  type: ActionType.fetchQueries;
  payload: Query[];
}

export interface AddQueryAction {
  type: ActionType.addQuery;
  payload: Query;
}

export interface DeleteQueryAction {
  type: ActionType.deleteQuery;
  payload: Query[];
}

export interface UpdateQueryAction {
  type: ActionType.updateQuery;
  payload: Query[];
}
