import { Action } from '../actions';
import { ActionType } from '../action-types';
import { Config, Query } from '../../interfaces';
import { configTemplate } from '../../utility';

interface ConfigState {
  loading: boolean;
  // server truth — what the settings forms read and edit
  baseConfig: Config;
  // derived view: baseConfig + the active profile's overrides. All regular
  // consumers keep reading `config`, so overrides apply everywhere without
  // touching them.
  config: Config;
  activeOverrides: Partial<Config> | null;
  customQueries: Query[];
}

const initialState: ConfigState = {
  loading: true,
  baseConfig: { ...configTemplate },
  config: { ...configTemplate },
  activeOverrides: null,
  customQueries: [],
};

const merge = (base: Config, overrides: Partial<Config> | null): Config => ({
  ...base,
  ...(overrides ?? {}),
});

export const configReducer = (
  state: ConfigState = initialState,
  action: Action
): ConfigState => {
  switch (action.type) {
    case ActionType.getConfig:
      return {
        ...state,
        loading: false,
        baseConfig: action.payload,
        config: merge(action.payload, state.activeOverrides),
      };

    case ActionType.updateConfig:
      return {
        ...state,
        baseConfig: action.payload,
        config: merge(action.payload, state.activeOverrides),
      };

    case ActionType.applyProfileOverrides:
      return {
        ...state,
        activeOverrides: action.payload,
        config: merge(state.baseConfig, action.payload),
      };

    case ActionType.fetchQueries:
      return {
        ...state,
        customQueries: action.payload,
      };

    case ActionType.addQuery:
      return {
        ...state,
        customQueries: [...state.customQueries, action.payload],
      };

    case ActionType.deleteQuery:
      return {
        ...state,
        customQueries: action.payload,
      };

    case ActionType.updateQuery:
      return {
        ...state,
        customQueries: action.payload,
      };

    default:
      return state;
  }
};
