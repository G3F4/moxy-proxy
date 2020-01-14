import { readFileSync } from 'fs';
import produce from 'immer';
import { App, HttpRequest, WebSocket } from 'uWebSockets.js';
import { PORT } from '../constans';
import { Method, Route } from '../sharedTypes';
import { readJsonAsync } from './utils/readJson';

let serverState: JSON = JSON.parse(readFileSync(`${process.cwd()}/data/initialState.json`, 'utf8'));
let routes: Route[] = JSON.parse(readFileSync(`${process.cwd()}/data/routes.json`, 'utf8'));
let Sockets: WebSocket[] = [];

function updateServerState(serverStateUpdate: Partial<typeof serverState>) {
  serverState = {
    ...serverState,
    ...serverStateUpdate
  };
}

function addRoute(route: Route) {
  routes = [...routes, route];
}

function updateRoute(route: Route) {
  const routeIndex = routes.findIndex(
    ({ url, method }) => route.url === url && route.method === method
  );

  // @ts-ignore
  routes[routeIndex] = route;
}

function sendEvent(socket: WebSocket, action: string, payload: any): void {
  try {
    socket.send(JSON.stringify({action, payload}));
  } catch (e) {
    console.error(e);
  }
}

function broadcast(event: { action: string, payload: any }) {
  Sockets.forEach(socket => {
    try {
      socket.send(JSON.stringify(event));
    } catch (e) {
      return undefined;
    }
  });
}

App().ws('/*', {
  message: (ws, message) => {
    // @ts-ignore
    const { action, payload } = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(message)));

    if (action === 'addRoute') {
      addRoute(payload);
      sendEvent(ws,'updateRoutes', routes);
    }

    if (action === 'updateRoute') {
      updateRoute(payload);
      sendEvent(ws,'updateRoutes', routes);
    }

    if (action === 'clientUpdatedServerServer') {
      updateServerState(payload);
    }
  },
  open: (ws: WebSocket, req: HttpRequest) => {
    ws.id = Date.now();
    Sockets.push(ws);
    ws.send(JSON.stringify({
      action: 'updateServerState',
      payload: serverState,
    }));
    ws.send(JSON.stringify({
      action: 'updateRoutes',
      payload: routes,
    }));
    console.log(['ws:open'], req);
  },
  close: (ws: WebSocket, code: number, message: ArrayBuffer) => {
    console.log(['ws:close'], code, message);

    Sockets = Sockets.filter(socket => socket.id === ws.id);
  }
}).any('/*', async (res, req) => {
  try {
    const method = req.getMethod() as Method;
    const url = req.getUrl() !== '/' ? req.getUrl() : '/index.html';
    const urlLastChar = url[url.length - 1];
    const rawUrl = urlLastChar === '/' ? url.slice(0, -1) : url;
    const route = routes.find(route => route.url === rawUrl && route.method === method);

    if (route) {
      const requestBody = await readJsonAsync(res);
      const request = {
        body: requestBody,
      };
      // eslint-disable-next-line no-new-func
      const responseFunction = new Function('state', 'request', route.responseCode.trim());
      // eslint-disable-next-line no-new-func
      const serverStateUpdateFunction = new Function('request', route.serverStateUpdateCode.trim());
      const responseFunctionReturn = responseFunction(serverState, request);
      
      if (typeof serverStateUpdateFunction === 'function') {
        const serverStateUpdateFunctionReturn = produce(serverState, serverStateUpdateFunction(request));

        updateServerState(serverStateUpdateFunctionReturn);
  
        broadcast({
          action: 'updateServerState',
          payload: serverState,
        });
      }

      res.end(JSON.stringify(responseFunctionReturn));
    } else {
      const file = readFileSync(`${process.cwd()}/build${url}`);

      res.end(file);
    }
  } catch (e) {
    console.error(`error: ${e.toString()}`);
    res.writeStatus('404');
    res.end();
  }
}).listen(PORT, (listenSocket) => {
  if (listenSocket) {
    console.log(`Listening to port: ${PORT}`);
  }
});

// curl -i --header "Content-Type: application/json" --request GET  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request PUT  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request DELETE  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request PATCH --data '{ "requestCount": 12 }'  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request POST --data '{ "secret": true }'  http://localhost:5000/test
