import { Paper } from '@material-ui/core';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import React, { lazy, Suspense, useContext } from 'react';
import { AppStateContext } from '../App';

const LazyEndpoints = lazy(() => import('../modules/endpoints/Endpoints'));
const LazyServerState = lazy(() => import('../modules/server-state/ServerState'));
const LazyStateInterface = lazy(() => import('../modules/state-interface/StateInterface'));

export default function TabsLayout() {
  const { activeTab, changeActiveTab } = useContext(AppStateContext);

  function handleActiveTabChange(event: React.ChangeEvent<{}>, newValue: number) {
    changeActiveTab(newValue);
  }

  return (
    <>
      <Paper style={{ flexGrow: 1 }}>
        <Tabs
          centered
          indicatorColor="primary"
          textColor="primary"
          value={activeTab}
          onChange={handleActiveTabChange}
        >
          <Tab label="State interface" />
          <Tab label="Server state" />
          <Tab label="Endpoints" />
        </Tabs>
      </Paper>
      {activeTab === 0 && (
        <Suspense fallback="Loading state interface...">
          <LazyStateInterface />
        </Suspense>
      )}
      {activeTab === 1 && (
        <Suspense fallback="Loading server state...">
          <LazyServerState />
        </Suspense>
      )}
      {activeTab === 2 && (
        <Suspense fallback="Loading endpoints...">
          <LazyEndpoints />
        </Suspense>
      )}
    </>
  );
}
