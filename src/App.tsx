import { Divider } from '@material-ui/core';
import React, { lazy, useEffect, useState, Suspense } from 'react';
import { ServerState } from '../interfaces';
import { Endpoint, ServerEvent } from '../sharedTypes';
import './App.css';

const LazyHeader = lazy(() => import('./modules/header/Header'));
const LazyEndpoints = lazy(() => import('./modules/endpoints/Endpoints'));
const LazyServerState = lazy(() => import('./modules/server-state/ServerState'));
const socketUrl =
  process.env.NODE_ENV === 'production' ? `wss://${window.location.host}` : 'ws://localhost:5000';

function initialServerState(): ServerState {
  //@ts-ignore
  return {};
}

function initialEndpoint(): Endpoint[] {
  return [];
}

export const AppStateContext = React.createContext({
  serverState: initialServerState(),
  endpoints: initialEndpoint(),
  serverStateInterface: '',

  updateServerState(_serverState: unknown) {},
  resetServerState() {},
  addEndpoint(_endpoint: Endpoint) {},
  deleteEndpoint(_endpointId: string) {},
  updateEndpoint(_endpoint: Endpoint) {},
  testEndpoint(_endpoint: Endpoint, _requestBody: string) {
    return Promise.resolve(new Response(''));
  },
});

function parseMessage(message: string): { action: ServerEvent; payload: unknown } {
  const { action, payload } = JSON.parse(message);

  return { action, payload };
}

const socket = new WebSocket(socketUrl);
const App: React.FC = () => {
  const [serverState, setServerState] = useState(initialServerState);
  const [serverStateInterface, setServerStateInterface] = useState('');
  const [endpoints, setEndpoints] = useState(initialEndpoint);

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

      const { action, payload } = parseMessage(event.data);

      if (action === 'updateEndpoints') {
        setEndpoints(payload as Endpoint[]);
      }

      if (action === 'updateServerState') {
        setServerState(payload as ServerState);
      }

      if (action === 'updateServerStateInterface') {
        setServerStateInterface(payload as string);
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

  function handleAddEndpoint(endpoint: Endpoint) {
    sendEvent({
      action: 'addEndpoint',
      payload: endpoint,
    });
  }

  function handleUpdateEndpoint(endpoint: Endpoint) {
    sendEvent({
      action: 'updateEndpoint',
      payload: endpoint,
    });
  }

  function handleDeleteEndpoint(endpointId: string) {
    sendEvent({
      action: 'deleteEndpoint',
      payload: endpointId,
    });
  }

  async function handleTestEndpoint({ url, method }: Endpoint, requestBody: string) {
    const parsedBody = JSON.parse(requestBody);
    const isEmpty = Object.keys(parsedBody).length === 0;
    const body = isEmpty ? undefined : JSON.stringify(parsedBody);

    return await fetch(`${url}`, {
      body,
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
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
    endpoints,
    serverState,
    serverStateInterface,
    updateServerState: handleServerStateChange,
    resetServerState: handleResetServerState,
    addEndpoint: handleAddEndpoint,
    updateEndpoint: handleUpdateEndpoint,
    deleteEndpoint: handleDeleteEndpoint,
    testEndpoint: handleTestEndpoint,
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
        <Suspense fallback="Loading endpoints...">
          <LazyEndpoints endpoints={endpoints || []} />
        </Suspense>
      </AppStateContext.Provider>
    </div>
  );
};

export default App;
