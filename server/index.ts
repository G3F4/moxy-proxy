import { exec } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import produce from 'immer';
import * as util from 'util';
import { App, WebSocket } from 'uWebSockets.js';
import { PORT } from '../constans';
import { ServerState } from '../interfaces';
import { ClientEvent, Method, Route, ServerEvent } from '../sharedTypes';
import { logError, logInfo } from './utils/logger';
import { readJsonAsync } from './utils/readJson';

const initialServerStateDataPath = `${process.cwd()}/data/initialServerState.json`;
const serverStateInterfacePath = `${process.cwd()}/interfaces.ts`;
const routesDataPath = `${process.cwd()}/data/routes.json`;

function loadInitialServerState() {
  return JSON.parse(readFileSync(initialServerStateDataPath, 'utf8'));
}

function loadServerStateInterface() {
  return readFileSync(serverStateInterfacePath, 'utf8').toString();
}

function saveRoutesToFile(items: unknown) {
  writeFileSync(routesDataPath, JSON.stringify({ items }, null, 2), 'utf-8');
}

function saveServerStateToFile(data: unknown) {
  writeFileSync(initialServerStateDataPath, JSON.stringify(data, null, 2), 'utf-8');
}

const initialServerState = loadInitialServerState();
let serverState = loadInitialServerState();
let routes: Route[] = JSON.parse(readFileSync(routesDataPath, 'utf8')).items;
let Sockets: WebSocket[] = [];
let serverStateInterface = loadServerStateInterface();

function updateServerState(serverStateUpdate: Partial<typeof serverState>) {
  serverState = {
    ...serverState,
    ...serverStateUpdate,
  };

  logInfo(['updateServerState'], serverStateUpdate);
  saveServerStateToFile(serverState);
}

function resetServerState() {
  logInfo(['resetServerState'], initialServerState);
  updateServerState(initialServerState);
}

function addRoute(route: Route) {
  routes = [...routes, route];

  logInfo(['addRoute'], route);
  saveRoutesToFile(routes);
}

function updateRoute(route: Route) {
  const routeIndex = routes.findIndex(
    ({ url, method }) => route.url === url && route.method === method,
  );

  // @ts-ignore
  routes[routeIndex] = route;

  logInfo(['updateRoute'], route);
  saveRoutesToFile(routes);
}

function deleteRoute(routeId: string) {
  routes = routes.filter(({ id }) => id !== routeId);

  logInfo(['deleteRoute'], routeId);
  saveRoutesToFile(routes);
}

function sendEvent(socket: WebSocket, action: ServerEvent, payload: any): void {
  try {
    socket.send(JSON.stringify({ action, payload }));
    logInfo(['sendEvent'], { action, payload });
  } catch (e) {
    logError(e);
  }
}

function broadcast(action: ServerEvent, payload: unknown) {
  logInfo(['broadcast'], action, payload);

  Sockets.forEach(socket => {
    try {
      socket.send(JSON.stringify(event));
    } catch (e) {
      return undefined;
    }
  });
}

const execPromised = util.promisify(exec);

async function makeTypesFromInitialServerState() {
  const { stdout, stderr } = await execPromised(
    'make_types -i interfaces.ts -p proxies.ts data/initialServerState.json ServerState',
  );

  logInfo(['makeTypesFromInitialServerState'], stdout, stderr);

  broadcast('updateServerStateInterface', serverStateInterface);
}

function parseMessage(message: ArrayBuffer): { action: ClientEvent; payload: unknown } {
  const { action, payload } = JSON.parse(
    // @ts-ignore
    String.fromCharCode.apply(null, new Uint8Array(message)),
  );

  return { action, payload };
}

App()
  .ws('/*', {
    message: (ws, message) => {
      const { action, payload } = parseMessage(message);

      if (action === 'addRoute') {
        addRoute(payload as Route);
        sendEvent(ws, 'updateRoutes', routes);
      }

      if (action === 'updateRoute') {
        updateRoute(payload as Route);
        sendEvent(ws, 'updateRoutes', routes);
      }

      if (action === 'deleteRoute') {
        deleteRoute(payload as string);
        sendEvent(ws, 'updateRoutes', routes);
      }

      if (action === 'clientUpdatedServer') {
        updateServerState(payload as ServerState);
        broadcast('updateServerState', serverState);
      }

      if (action === 'resetServerState') {
        resetServerState();
        sendEvent(ws, 'updateServerState', serverState);
      }
    },
    open: (ws: WebSocket) => {
      ws.id = Date.now();
      Sockets.push(ws);

      sendEvent(ws, 'updateServerState', serverState);
      sendEvent(ws, 'updateServerStateInterface', serverStateInterface);
      sendEvent(ws, 'updateRoutes', routes);
    },
    close: (ws: WebSocket) => {
      Sockets = Sockets.filter(socket => socket.id === ws.id);
    },
  })
  .any('/*', async (res, req) => {
    try {
      const method = req.getMethod() as Method;
      const url = req.getUrl() !== '/' ? req.getUrl() : '/index.html';
      const urlLastChar = url[url.length - 1];
      const rawUrl = urlLastChar === '/' ? url.slice(0, -1) : url;
      const route = routes.find(route => route.url === rawUrl && route.method === method);

      logInfo(['url'], url);
      logInfo(['method'], method);

      if (route) {
        const requestBody = await readJsonAsync(res);
        const request = {
          body: requestBody,
        };
        // eslint-disable-next-line no-new-func
        const responseFunction = new Function('state', 'request', route.responseCode.trim());
        // eslint-disable-next-line no-new-func
        const serverStateUpdateFunction = new Function(
          'request',
          route.serverStateUpdateCode.trim(),
        );
        const responseFunctionReturn = responseFunction(serverState, request);

        logInfo(['responseFunctionReturn'], responseFunctionReturn);

        if (typeof serverStateUpdateFunction === 'function') {
          const serverStateUpdateFunctionReturn = produce(
            serverState,
            serverStateUpdateFunction(request),
          );

          updateServerState(serverStateUpdateFunctionReturn);

          broadcast('updateServerState', serverState);
        }

        res.end(JSON.stringify(responseFunctionReturn));
      } else {
        const file = readFileSync(`${process.cwd()}/build${url}`);

        res.end(file);
      }
    } catch (e) {
      logError(`error: ${e.toString()}`);
      res.writeStatus('404');
      res.end();
      logError(['error'], e);
    }
  })
  .listen(PORT, async listenSocket => {
    if (listenSocket) {
      logError(`Listening to port: ${PORT}`);
    }

    await makeTypesFromInitialServerState();
  });

// curl -i --header "Content-Type: application/json" --request GET  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request PUT  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request DELETE  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request PATCH --data '{ "requestCount": 12 }'  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request POST --data '{ "secret": true }'  http://localhost:5000/test
