import React, { lazy, Suspense } from 'react';

const LazyEndpoints = lazy(() => import('../modules/endpoints/Endpoints'));
const LazyServerState = lazy(() => import('../modules/server-state/ServerState'));
const LazyStateInterface = lazy(() => import('../modules/state-interface/StateInterface'));

export default function PanelLayout() {
  return (
    <>
      <Suspense fallback="Loading server state...">
        <LazyServerState />
      </Suspense>
      <Suspense fallback="Loading state interface...">
        <LazyStateInterface />
      </Suspense>
      <Suspense fallback="Loading endpoints...">
        <LazyEndpoints />
      </Suspense>
    </>
  );
}
