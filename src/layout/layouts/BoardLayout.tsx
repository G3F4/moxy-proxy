import { Grid } from '@material-ui/core';
import React, { lazy, Suspense } from 'react';

const LazyEndpoints = lazy(() => import('../../modules/endpoints/Endpoints'));
const LazyServerState = lazy(() =>
  import('../../modules/server-state/ServerState'),
);
const LazyStateInterface = lazy(() =>
  import('../../modules/state-interface/StateInterface'),
);

export default function BoardLayout() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={6}>
        <Suspense fallback="Loading server state...">
          <LazyServerState />
        </Suspense>
      </Grid>
      <Grid item xs={6}>
        <Suspense fallback="Loading state interface...">
          <LazyStateInterface />
        </Suspense>
      </Grid>
      <Grid item xs={12}>
        <Suspense fallback="Loading endpoints...">
          <LazyEndpoints />
        </Suspense>
      </Grid>
    </Grid>
  );
}
