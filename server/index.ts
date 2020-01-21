import { exec } from 'child_process';
import { existsSync, readFileSync, watchFile, writeFileSync } from 'fs';
import produce from 'immer';
import * as util from 'util';
import { App, HttpRequest, HttpResponse, WebSocket } from 'uWebSockets.js';
import { PORT } from '../constans';
import { ServerState } from '../interfaces';
import {
  ClientAction,
  ClientEvent,
  Endpoint,
  EndpointMapping,
  Method,
  ServerEvent,
} from '../sharedTypes';
import createFolderIfNotExists from './utils/createFolderIfNotExists';
import { logError, logInfo } from './utils/logger';
import { readJsonAsync } from './utils/readJson';

const initialServerStateDataRelativePath = 'data/serverState/initialServerState.json';
const initialServerStateDataPath = `${process.cwd()}/${initialServerStateDataRelativePath}`;
const endpointsMapPath = `${process.cwd()}/data/endpointsMap.json`;
const serverStateInterfaceFileName = 'interfaces.ts';
const serverStateInterfacePath = `${process.cwd()}/${serverStateInterfaceFileName}`;
const initialServerState = loadInitialServerState();
let endpointMappings: EndpointMapping[] = JSON.parse(readFileSync(endpointsMapPath, 'utf8'));
let serverState = loadInitialServerState();
let endpoints: Endpoint[] = [];
let Sockets: WebSocket[] = [];
let serverStateInterface = loadServerStateInterface();

function handlerPath({ url, method }: Endpoint | EndpointMapping) {
  return `${process.cwd()}/endpoints/${url}/${method}.js`;
}

function handlerTemplate(endpoint: Endpoint) {
  return (
    `
export ${endpoint.responseCode.trim()}

export ${endpoint.serverStateUpdateCode.trim()}
`.trim() + '\n'
  );
}

function loadHandler(endpoint: Endpoint | EndpointMapping): Handler {
  const path = handlerPath(endpoint);

  nocache(path);

  return require(path);
}

function loadInitialServerState() {
  return JSON.parse(readFileSync(initialServerStateDataPath, 'utf8'));
}

function loadServerStateInterface() {
  return readFileSync(serverStateInterfacePath, 'utf8').toString();
}

function loadEndpoints(): Endpoint[] {
  return endpointMappings.map((endpointMapping: EndpointMapping) => {
    const { id, method, url } = endpointMapping;
    const handler = loadHandler(endpointMapping);

    return {
      id,
      method,
      url,
      responseCode: handler.requestResponse.toString(),
      serverStateUpdateCode: handler.serverUpdate.toString(),
    };
  });
}

export type RequestResponse = (state: ServerState, request: unknown) => unknown;
export type ServerUpdate = (request: unknown) => (state: ServerState) => void;

export interface Handler {
  requestResponse: RequestResponse;
  serverUpdate: ServerUpdate;
}

function saveEndpointToFile(endpoint: Endpoint) {
  const code = handlerTemplate(endpoint);
  const folders = endpoint.url.split('/');

  folders.forEach((item, index, arr) => {
    const absolutePath = `${process.cwd()}/endpoints/${arr.slice(0, index + 1).join('/')}`;

    createFolderIfNotExists(absolutePath);
  });

  const path = handlerPath(endpoint);
  const fileExists = existsSync(path);

  if (fileExists) {
    writeFileSync(path, code);
  } else {
    writeFileSync(path, code, { flag: 'wx' });
  }
}

function saveServerStateToFile(data: unknown) {
  writeFileSync(initialServerStateDataPath, JSON.stringify(data, null, 2), 'utf-8');
}

function saveEndpointMappings(data: unknown) {
  writeFileSync(endpointsMapPath, JSON.stringify(data, null, 2), 'utf-8');
}

function updateServerState(serverStateUpdate: Partial<typeof serverState>) {
  logInfo(['updateServerState'], serverStateUpdate);

  serverState = {
    ...serverState,
    ...serverStateUpdate,
  };

  saveServerStateToFile(serverState);
  makeTypesFromInitialServerState().then(() => {
    logInfo(['makeTypesFromInitialServerState'], 'done');
  });
}

function resetServerState() {
  logInfo(['resetServerState'], initialServerState);
  updateServerState(initialServerState);
}

function addEndpoint(endpoint: Endpoint) {
  logInfo(['addEndpoint'], endpoint);

  const endpointMapping: EndpointMapping = {
    id: Date.now().toString(),
    method: endpoint.method,
    url: endpoint.url,
  };

  endpoints = [...endpoints, endpoint];
  endpointMappings = [...endpointMappings, endpointMapping];

  saveEndpointMappings(endpointMappings);
  saveEndpointToFile(endpoint);
}

function updateEndpoint(endpoint: Endpoint) {
  const endpointIndex = endpoints.findIndex(
    ({ url, method }) => endpoint.url === url && endpoint.method === method,
  );

  // @ts-ignore
  endpoints[endpointIndex] = endpoint;

  logInfo(['updateEndpoint'], endpoint);

  saveEndpointToFile(endpoint);
}

function deleteEndpoint(endpointId: string) {
  endpoints = endpoints.filter(({ id }) => id !== endpointId);
  endpointMappings = endpointMappings.filter(({ id }) => id !== endpointId);

  saveEndpointMappings(endpointMappings);
  logInfo(['deleteEndpoint'], endpointId);
}

function sendEvent(socket: WebSocket, event: ServerEvent): void {
  try {
    socket.send(JSON.stringify(event));
    // logInfo(['sendEvent'], { action, payload });
  } catch (e) {
    logError(e);
  }
}

function nocache(module: string) {
  watchFile(require('path').resolve(module), () => {
    delete require.cache[require.resolve(module)];
  });
}

function clearSocket(socketId: string) {
  Sockets.filter(({ id }) => id === socketId);
}

function broadcast(event: ServerEvent) {
  logInfo(['broadcast'], event);

  Sockets.forEach(socket => {
    try {
      socket.send(JSON.stringify(event));
    } catch (e) {
      logError(e);
      clearSocket(socket.id);
    }
  });
}

const execPromised = util.promisify(exec);

async function makeTypesFromInitialServerState() {
  const { stdout, stderr } = await execPromised(
    `make_types -i ${serverStateInterfaceFileName} ${initialServerStateDataRelativePath} ServerState`,
  );

  logInfo(['makeTypesFromInitialServerState'], stdout, stderr);

  serverStateInterface = loadServerStateInterface();

  broadcast({ action: 'updateServerStateInterface', payload: serverStateInterface });
}

function parseMessage(message: ArrayBuffer): { action: ClientAction; payload: unknown } {
  const { action, payload } = JSON.parse(
    // @ts-ignore
    String.fromCharCode.apply(null, new Uint8Array(message)),
  );

  return { action, payload };
}

const clientMessageHandlers: Record<ClientAction, (ws: WebSocket, payload: any) => void> = {
  addEndpoint(ws: WebSocket, payload: Endpoint) {
    addEndpoint(payload as Endpoint);
    sendEvent(ws, { action: 'updateEndpoints', payload: endpoints });
  },
  addServerStateScenario(ws: WebSocket, payload: Endpoint) {},
  clientUpdatedServer(ws: WebSocket, payload: ServerState) {
    updateServerState(payload);
    broadcast({ action: 'updateServerState', payload: serverState });
  },
  deleteEndpoint(ws: WebSocket, payload: string) {
    deleteEndpoint(payload);
    sendEvent(ws, { action: 'updateEndpoints', payload: endpoints });
  },
  ping(ws: WebSocket, _payload: unknown) {},
  resetServerState(ws: WebSocket, _payload: undefined) {
    resetServerState();
    sendEvent(ws, { action: 'updateServerState', payload: serverState });
  },
  updateEndpoint(ws: WebSocket, payload: Endpoint) {
    updateEndpoint(payload);
    sendEvent(ws, { action: 'updateEndpoints', payload: endpoints });
  },
};

function messageHandler(ws: WebSocket, message: ArrayBuffer) {
  const { action, payload } = parseMessage(message);
  const handler = clientMessageHandlers[action];

  handler(ws, payload);
}

function openHandler(ws: WebSocket) {
  ws.id = Date.now();
  Sockets.push(ws);

  sendEvent(ws, { action: 'updateServerState', payload: serverState });
  sendEvent(ws, { action: 'updateServerStateInterface', payload: serverStateInterface });
  sendEvent(ws, { action: 'updateEndpoints', payload: endpoints });
}

function closeHandler(ws: WebSocket) {
  Sockets = Sockets.filter(socket => socket.id === ws.id);
}

async function httpHandler(res: HttpResponse, req: HttpRequest) {
  try {
    const method = req.getMethod() as Method;
    const url = req.getUrl() !== '/' ? req.getUrl() : '/index.html';
    const urlLastChar = url[url.length - 1];
    const rawUrl = urlLastChar === '/' ? url.slice(0, -1) : url;
    const endpoint = endpoints.find(
      endpoint => `/${endpoint.url}` === rawUrl && endpoint.method === method,
    );

    logInfo(['url'], url);
    logInfo(['method'], method);

    if (endpoint) {
      const requestBody = await readJsonAsync(res);
      const request = {
        body: requestBody,
      };
      const { requestResponse, serverUpdate } = loadHandler(endpoint);

      logInfo(['requestResponse'], requestResponse.toString());
      logInfo(['serverUpdate'], serverUpdate.toString());

      const requestResponseReturn = requestResponse(serverState, request);

      logInfo(['requestResponseReturn'], requestResponseReturn);

      const newServerState = produce(serverState, serverUpdate(request));

      updateServerState(newServerState);

      broadcast({ action: 'updateServerState', payload: serverState });

      res.end(JSON.stringify(requestResponseReturn));
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
}

async function startServerHandler(listenSocket: any) {
  if (listenSocket) {
    logError(`Listening to port: ${PORT}`);
  }

  endpoints = loadEndpoints();

  await makeTypesFromInitialServerState();
}

const webSocketBehavior = {
  message: messageHandler,
  open: openHandler,
  close: closeHandler,
};

App()
  .ws('/*', webSocketBehavior)
  .any('/*', httpHandler)
  .listen(PORT, startServerHandler);

// curl -i --header "Content-Type: application/json" --request GET  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request PUT  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request DELETE  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request PATCH --data '{ "requestCount": 12 }'  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request POST --data '{ "secret": true }'  http://localhost:5000/test
