import { App, HttpRequest, WebSocket } from 'uWebSockets.js';
import { readFileSync } from 'fs';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

let state = {
  serverState: {
    empty: true,
  },
  routes: [],
};

function updateState(stateUpdate: Partial<typeof state>) {
  state = {
    ...state,
    ...stateUpdate
  };
}

const sendEvent = (socket: WebSocket, action: string, payload: any): void => {
  try {
    socket.send(JSON.stringify({ action, payload }));
  }
  
  catch (e) {
    console.error(e);
  }
};

App().ws('/*', {
  message: (ws, message, isBinary) => {
    const { action, payload } = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(message)));
    console.log(['ws:message:action'], action);
    console.log(['ws:message:payload'], payload);
    if (action === 'routeAdded') {
      updateState({
        routes: payload,
      });
      sendEvent(ws,'updateStateServer', state);
    }
  },
  open: (ws: WebSocket, req: HttpRequest) => {
    ws.send(JSON.stringify({
      action: 'initialState',
      payload: state,
    }));
    console.log(['ws:open'], req);
  },
  close: (ws: WebSocket, code: number, message: ArrayBuffer) => {
    console.log(['ws:close'], code, message);
  }
}).any('/*', (response, request) => {
  try {
    const url = request.getUrl() && request.getUrl() !== '/' ? request.getUrl() : '/index.html';
    const file = readFileSync(`${process.cwd()}/build${url}`);
    
    response.end(file);
  } catch (e) {
    console.error(`error: ${e.toString()}`);
    response.end(e.toString());
  }
}).listen(PORT, (listenSocket) => {
  if (listenSocket) {
    console.log(`Listening to port: ${PORT}`);
  }
});