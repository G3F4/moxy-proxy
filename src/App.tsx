import React, {useEffect, useState} from 'react';
import './App.css';
import {Route} from './modules/add-route/AddRouteStepper';
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

const socket = new WebSocket(socketUrl);

const App: React.FC = () => {
  const [serverStateLoaded, setServerStateLoaded] = useState(false);
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
    console.log(['starting socket'])
    
  
    socket.onopen = event => {
      console.log(['WebSocket.onopen'], event);
    };
  
    socket.onclose = event => {
      console.log(['WebSocket.onclose'], event);
    };
  
    socket.onmessage = event => {
      console.log(['WebSocket.onmessage'], JSON.parse(event.data));
      const { action, payload } = JSON.parse(event.data);
      
      if (action === 'initialState') {
        setServerState(payload);
        setServerStateLoaded(true);
      }
      
      if (action === 'updateStateServer') {
        setServerState(payload);
      }
    };
  
    socket.onerror = event => {
      console.error(['WebSocket.onerror'], event);
    };
  }, []);
  
  function handleRouteAdded(route: Route) {
    console.log(['handleRouteAdded'], route)
    setRoutes([...routes, route]);
    sendEvent({
      action: 'routeAdded',
      payload: [...routes, route],
    })
  }
  
  return (
    <div className="App">
      <Header addRoute={handleRouteAdded} />
      {serverStateLoaded && (
        <ServerState state={serverState} setState={setServerState} />
      )}
      <Routes routes={serverState.routes || []} />
    </div>
  );
};

export default App;
