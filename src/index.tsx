import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';

const LazyApp = lazy(() => import('./App'));

ReactDOM.render(
  <Suspense fallback="Loading...">
    <LazyApp />
  </Suspense>,
  document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
if (process.env.NODE_ENV === 'production') {
  serviceWorker.register();
} else {
  serviceWorker.unregister();
}
