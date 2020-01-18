import { Divider } from '@material-ui/core';
import React, { lazy, useEffect, useState, Suspense } from 'react';
import { Route } from '../sharedTypes';
import './App.css';

const LazyHeader = lazy(() => import('./modules/header/Header'));
const LazyRoutes = lazy(() => import('./modules/routes/Routes'));
const LazyServerState = lazy(() => import('./modules/server-state/ServerState'));

const socketUrl =
  process.env.NODE_ENV === 'production' ? `ws://${window.location.host}` : 'ws://localhost:5000';

function initialServerState(): any {
  return {};
}

function initialRoutes(): Route[] {
  return [];
}

export const AppStateContext = React.createContext({
  serverState: initialServerState(),
  routes: initialRoutes(),

  updateServerState(_serverState: unknown) {},
  resetServerState() {},
  addRoute(_route: Route) {},
  updateRoute(_route: Route) {},
});

const socket = new WebSocket(socketUrl);
const App: React.FC = () => {
  const [serverState, setServerState] = useState(initialServerState);
  const [routes, setRoutes] = useState(initialRoutes);

  function sendEvent(event: any) {
    console.log(['sendEvent'], event);
    try {
      socket.send(JSON.stringify(event));
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    socket.onopen = event => {
      console.log(['WebSocket.onopen'], event);
    };

    socket.onclose = event => {
      console.log(['WebSocket.onclose'], event);
    };

    socket.onmessage = event => {
      console.log(['WebSocket.onmessage'], JSON.parse(event.data));

      const { action, payload } = JSON.parse(event.data);

      if (action === 'updateRoutes') {
        setRoutes(payload);
      }

      if (action === 'updateServerState') {
        setServerState(payload);
      }
    };

    socket.onerror = event => {
      console.error(['WebSocket.onerror'], event);
    };

    const pingInterval = setInterval(() => {
      sendEvent({
        action: 'ping',
      });
    }, 10000);

    return () => {
      clearInterval(pingInterval);
    };
  }, []);

  function handleResetServerState() {
    sendEvent({
      action: 'resetServerState',
      payload: null,
    });
  }

  function handleAddRoute(route: Route) {
    sendEvent({
      action: 'addRoute',
      payload: route,
    });
  }

  function handleUpdateRoute(route: Route) {
    sendEvent({
      action: 'updateRoute',
      payload: route,
    });
  }

  function handleServerStateChange(updatedServerState: any) {
    setServerState(updatedServerState);
    sendEvent({
      action: 'clientUpdatedServer',
      payload: updatedServerState,
    });
  }

  const contextValue = {
    routes,
    serverState,
    updateServerState: handleServerStateChange,
    resetServerState: handleResetServerState,
    addRoute: handleAddRoute,
    updateRoute: handleUpdateRoute,
  };

  return (
    <div className="App">
      <AppStateContext.Provider value={contextValue}>
        <Suspense fallback="Loading header...">
          <LazyHeader />
        </Suspense>
        <Suspense fallback="Loading server state...">
          <LazyServerState />
        </Suspense>
        <Divider />
        <Suspense fallback="Loading routes...">
          <LazyRoutes routes={routes || []} />
        </Suspense>
      </AppStateContext.Provider>
    </div>
  );
};

export default App;
