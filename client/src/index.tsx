import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

import { Provider } from 'react-redux';
import { store } from './store/store';

import { App } from './App';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container #root is missing in index.html');
}

createRoot(container).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
