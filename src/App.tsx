import {Divider} from '@material-ui/core';
import React, {useEffect, useState} from 'react';
import './App.css';
import {Route} from '../sharedTypes';
import Header from './modules/header/Header';
import Routes from './modules/routes/Routes';
import ServerState from './modules/server-state/ServerState';

const socketUrl = 'ws://localhost:5000';

function initialServerState(): any {
  return {}
}

function initialRoutes(): Route[] {
  return []
}

export const AppStateContext = React.createContext({
  serverState: initialServerState(),
  routes: initialRoutes(),
  addRoute(_route: Route) {},
});

const socket = new WebSocket(socketUrl);

const App: React.FC = () => {
  const [serverState, setServerState] = useState(initialServerState);
  const [routes, setRoutes] = useState(initialRoutes);
  function sendEvent(event: any) {
    try {
      socket.send(JSON.stringify(event));
    }

    catch (e) {
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
      })
    }, 10000);
    
    return () => {
      clearInterval(pingInterval);
    };
  }, []);
  
  function handleRouteAdded(route: Route) {
    sendEvent({
      action: 'addRoute',
      payload: route,
    })
  }
  
  const contextValue = {
    routes,
    serverState,
    addRoute: handleRouteAdded,
  };
  
  return (
    <div className="App">
      <AppStateContext.Provider value={contextValue}>
        <Header />
        <ServerState state={serverState} setState={setServerState} />
        <Divider />
        <Routes routes={routes || []} />
      </AppStateContext.Provider>
    </div>
  );
};

export default App;
