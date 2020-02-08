import React, { createContext, useEffect, useState } from 'react';
import { ServerState } from '../interfaces';
import {
  ClientEvent,
  Endpoint,
  HttpStatus,
  ServerAction,
  ServerEvent,
  ServerStateScenario,
} from '../sharedTypes';
import './App.css';
import useLocalstorage from './common/hooks/useLocalstorage';
import Layout from './layouts/Layout';
import { TabKey } from './layouts/TabsLayout';
import { urlDelimiter } from './modules/test-endpoint/TestEndpoint';

const socketHash = 'superHash123';
const socketUrl =
  process.env.NODE_ENV === 'production' && window.location.hostname !== 'localhost'
    ? `wss://${window.location.host}/${socketHash}`
    : `ws://localhost:5000/${socketHash}`;

function initialServerState(): ServerState {
  //@ts-ignore
  return {};
}

function initialEndpoint(): Endpoint[] {
  return [];
}

export type ViewMode = 'tabs' | 'panels' | 'board';

export const AppStateContext = createContext({
  activeTab: 'serverState' as TabKey,
  activeServerStateScenarioId: 'default',
  viewMode: 'tabs' as ViewMode,
  serverState: initialServerState(),
  endpoints: initialEndpoint(),
  serverStateInterface: '',
  serverStateScenarios: [] as ServerStateScenario[],

  changeViewMode(_viewMode: ViewMode) {},
  changeActiveTab(_tabKey: TabKey) {},
  addServerStateScenario(_serverStateScenario: ServerStateScenario) {},
  changeServerStateScenario(_serverStateScenarioId: string) {},
  updateServerState(_serverState: ServerState) {},
  resetServerState() {},
  addEndpoint(_endpoint: Endpoint) {},
  deleteEndpoint(_endpointId: string) {},
  changeEndpointResponseStatus(_endpointId: string, _status: HttpStatus | null) {},
  updateEndpoint(_endpoint: Endpoint) {},
  testEndpoint(_endpoint: Endpoint, _urlParameters: Record<string, string>, _queryString: string, _requestBody: string) {
    return Promise.resolve(new Response(''));
  },
});

function parseMessage(message: string): { action: ServerAction; payload: unknown } {
  const { action, payload } = JSON.parse(message);

  return { action, payload };
}

const socket = new WebSocket(socketUrl);

function App() {
  const [activeTab, setActiveTab] = useLocalstorage<TabKey>('activeTab', 'serverState');
  const [activeServerStateScenarioId, setActiveServerStateScenarioId] = useLocalstorage(
    'activeServerStateScenarioId',
    'default',
  );
  const [viewMode, setViewMode] = useLocalstorage<ViewMode>('viewMode', 'tabs');
  const [serverState, setServerState] = useState(initialServerState);
  const [serverStateScenarios, setServerStateScenarios] = useState([] as ServerStateScenario[]);
  const [serverStateInterface, setServerStateInterface] = useState('');
  const [endpoints, setEndpoints] = useState(initialEndpoint);

  function sendEvent(event: ClientEvent) {
    console.log(['sendEvent'], event);
    try {
      socket.send(JSON.stringify(event));
    } catch (e) {
      console.error(e);
    }
  }

  function messageHandler(event: ServerEvent) {
    const { action, payload } = event;
    const handlers: Record<ServerAction, (payload: any) => void> = {
      updateEndpoints(payload: Endpoint[]) {
        setEndpoints(payload);
      },
      updateServerState(payload: ServerState) {
        setServerState(payload);
      },
      updateServerStateInterface(payload: string) {
        setServerStateInterface(payload);
      },
      updateServerStateScenarios(payload: ServerStateScenario[]) {
        setServerStateScenarios(payload);
      },
    };

    handlers[action](payload);
  }

  useEffect(() => {
    socket.onopen = event => {
      console.log(['WebSocket.onopen'], event);
    };

    socket.onclose = event => {
      console.log(['WebSocket.onclose'], event);
      // TODO wznawianie połączenia po utracie
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    };

    socket.onmessage = event => {
      console.log(['WebSocket.onmessage'], JSON.parse(event.data));
      messageHandler(parseMessage(event.data));
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

  async function handleTestEndpoint(
    { url, method }: Endpoint,
    urlParameters: Record<string, string>,
    queryParams: string,
    requestBody: string,
  ) {
    const parsedBody = JSON.parse(requestBody);
    const isEmpty = method === 'get' || Object.keys(parsedBody).length === 0;
    const body = isEmpty ? undefined : JSON.stringify(parsedBody);
    const headers = isEmpty
      ? undefined
      : {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        };

    function parseUrlWithParameters(url: string, urlParameters: Record<string, string>) {
      const urlParts = url.split('/').filter(Boolean);

      return urlParts.reduce((acc, part) => {
        const urlParameter = part[0] === urlDelimiter;

        if (urlParameter) {
          return `${acc}/${urlParameters[part.slice(1)]}`
        }

        return `${acc}/${part}`;
      }, '')
    }

    const parsedUrl = `${parseUrlWithParameters(url, urlParameters)}?${queryParams}`;

    return await fetch(parsedUrl, {
      body,
      method,
      headers,
      credentials: 'include',
    });
  }

  function handleServerStateChange(updatedServerState: ServerState) {
    setServerState(updatedServerState);
    sendEvent({
      action: 'clientUpdatedServer',
      payload: {
        serverStateScenarioId: activeServerStateScenarioId,
        state: updatedServerState,
      },
    });
  }

  function handleAddServerStateScenario(serverStateScenario: ServerStateScenario) {
    setServerStateScenarios(scenarios => [...scenarios, serverStateScenario]);
    sendEvent({
      action: 'addServerStateScenario',
      payload: serverStateScenario,
    });
  }

  function handleChangeServerStateScenario(serverStateScenarioId: string) {
    sendEvent({
      action: 'changeServerStateScenario',
      payload: serverStateScenarioId,
    });
    // @ts-ignore
    setActiveServerStateScenarioId(serverStateScenarioId);
  }

  function handleChangeEndpointResponseStatus(endpointId: string, status: HttpStatus | null) {
    sendEvent({
      action: 'changeEndpointResponseStatus',
      payload: {
        endpointId,
        status,
      },
    });
  }

  const contextValue = {
    activeTab: activeTab as TabKey,
    activeServerStateScenarioId,
    endpoints,
    serverState,
    serverStateInterface,
    serverStateScenarios,
    viewMode,
    changeEndpointResponseStatus: handleChangeEndpointResponseStatus,
    addServerStateScenario: handleAddServerStateScenario,
    changeServerStateScenario: handleChangeServerStateScenario,
    changeViewMode: setViewMode,
    changeActiveTab: setActiveTab,
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
        <Layout />
      </AppStateContext.Provider>
    </div>
  );
}

export default App;
