import { Paper } from '@material-ui/core';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import React, { ChangeEvent, lazy, Suspense, useContext } from 'react';
import { AppStateContext } from '../App';

const LazyEndpoints = lazy(() => import('../modules/endpoints/Endpoints'));
const LazyServerState = lazy(() => import('../modules/server-state/ServerState'));
const LazyStateInterface = lazy(() => import('../modules/state-interface/StateInterface'));

export type TabKey = 'serverInterface' | 'serverState' | 'endpoints';

export interface Tab {
  label: string;
  value: TabKey;
}

const TabsConfig: Tab[] = [
  {
    value: 'serverInterface',
    label: 'State interface',
  },
  {
    value: 'serverState',
    label: 'State state',
  },
  {
    value: 'endpoints',
    label: 'Endpoints',
  },
];

export default function TabsLayout() {
  const { activeTab, changeActiveTab } = useContext(AppStateContext);

  function handleActiveTabChange(event: ChangeEvent<{}>, newValue: TabKey) {
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
          {TabsConfig.map(({ value, label }) => (
            <Tab key={value} label={label} value={value} />
          ))}
        </Tabs>
      </Paper>
      {activeTab === 'serverInterface' && (
        <Suspense fallback="Loading state interface...">
          <LazyStateInterface />
        </Suspense>
      )}
      {activeTab === 'serverState' && (
        <Suspense fallback="Loading server state...">
          <LazyServerState />
        </Suspense>
      )}
      {activeTab === 'endpoints' && (
        <Suspense fallback="Loading endpoints...">
          <LazyEndpoints />
        </Suspense>
      )}
    </>
  );
}
