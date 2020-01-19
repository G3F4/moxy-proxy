import { exec } from 'child_process';
import { existsSync, mkdirSync, readFileSync, watchFile, writeFileSync } from 'fs';
import produce from 'immer';
import * as util from 'util';
import { App, WebSocket } from 'uWebSockets.js';
import { PORT } from '../constans';
import { ServerState } from '../interfaces';
import { ClientEvent, Endpoint, EndpointMapping, Method, ServerEvent } from '../sharedTypes';
import { logError, logInfo } from './utils/logger';
import { readJsonAsync } from './utils/readJson';

const initialServerStateDataPath = `${process.cwd()}/data/initialServerState.json`;
const endpointsMapPath = `${process.cwd()}/data/endpointsMap.json`;
const serverStateInterfacePath = `${process.cwd()}/interfaces.ts`;
const initialServerState = loadInitialServerState();
let endpointMappings: EndpointMapping[] = JSON.parse(readFileSync(endpointsMapPath, 'utf8'));
let serverState = loadInitialServerState();
let endpoints: Endpoint[] = [];
let Sockets: WebSocket[] = [];
let serverStateInterface = loadServerStateInterface();

function loadInitialServerState() {
  return JSON.parse(readFileSync(initialServerStateDataPath, 'utf8'));
}

function loadServerStateInterface() {
  return readFileSync(serverStateInterfacePath, 'utf8').toString();
}

function getEndpointPath({ path }: EndpointMapping) {
  return `${process.cwd()}/${path}`;
}

async function loadEndpoints() {
  const endpoints: Endpoint[] = [];

  await Promise.all(
    endpointMappings.map(async (endpointMapping: EndpointMapping) => {
      const { id, method, url } = endpointMapping;
      const handler = await import(getEndpointPath(endpointMapping));

      endpoints.push({
        id,
        method,
        url,
        responseCode: handler.requestResponse.toString(),
        serverStateUpdateCode: handler.serverUpdate.toString(),
      });
    }),
  );

  return endpoints;
}

export interface Handler {
  requestResponse: Function;
  serverUpdate: Function;
}

function handlerPath({ url, method }: Endpoint) {
  return `${process.cwd()}/endpoints/${url}/${method}.js`;
}

function loadHandler(endpoint: Endpoint): Handler {
  return require(handlerPath(endpoint));
}

function handlerTemplate(endpoint: Endpoint) {
  return (
    `
export ${endpoint.responseCode.trim()}

export ${endpoint.serverStateUpdateCode.trim()}
`.trim() + '\n'
  );
}

function createFolderIfNotExists(path: string) {
  if (!existsSync(path)){
    mkdirSync(path);
  }
}

function saveEndpointToFile(endpoint: Endpoint, endpointMapping: EndpointMapping) {
  if (endpointMapping) {
    const code = handlerTemplate(endpoint);
    const folders = endpointMapping.url.split('/');

    folders.forEach((item, index, arr) => {
      const absolutePath = `${process.cwd()}/endpoints/${arr.slice(0, index + 1).join('/')}`;

      createFolderIfNotExists(absolutePath)
    });

    console.log(['folders'], folders)

    const path = `${process.cwd()}/${endpointMapping.path}`;
    const fileExists = existsSync(path);

    nocache(path);

    if (fileExists) {
      writeFileSync(path, code);
    } else {
      writeFileSync(path, code, { flag: 'wx' });
    }
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

  const path = `endpoints/${endpoint.url}/${endpoint.method}.js`;
  const endpointMapping: EndpointMapping = {
    path,
    id: Date.now().toString(),
    method: endpoint.method,
    url: endpoint.url,
  };

  endpoints = [...endpoints, endpoint];
  endpointMappings = [...endpointMappings, endpointMapping];

  saveEndpointMappings(endpointMappings);
  saveEndpointToFile(endpoint, endpointMapping);
}

function updateEndpoint(endpoint: Endpoint) {
  const endpointIndex = endpoints.findIndex(
    ({ url, method }) => endpoint.url === url && endpoint.method === method,
  );
  const endpointMapping = endpointMappings.find((item: any) => item.id === endpoint.id);

  // @ts-ignore
  endpoints[endpointIndex] = endpoint;

  logInfo(['updateEndpoint'], endpoint);

  endpointMapping && saveEndpointToFile(endpoint, endpointMapping);
}

function deleteEndpoint(endpointId: string) {
  // const endpoint = { ...(endpoints.find(({ id }) => id === endpointId) || {}) };
  endpoints = endpoints.filter(({ id }) => id !== endpointId);
  endpointMappings = endpointMappings.filter(({ id }) => id !== endpointId);

  logInfo(['deleteEndpoint'], endpointId);
  // deleteEndpointHandler(endpoint);
}

function sendEvent(socket: WebSocket, action: ServerEvent, payload: unknown): void {
  try {
    socket.send(JSON.stringify({ action, payload }));
    logInfo(['sendEvent'], { action, payload });
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

function broadcast(action: ServerEvent, payload: unknown) {
  logInfo(['broadcast'], action, payload);

  Sockets.forEach(socket => {
    try {
      socket.send(JSON.stringify({ action, payload }));
    } catch (e) {
      logError(e);
      clearSocket(socket.id);
    }
  });
}

const execPromised = util.promisify(exec);

async function makeTypesFromInitialServerState() {
  const { stdout, stderr } = await execPromised(
    'make_types -i interfaces.ts -p proxies.ts data/initialServerState.json ServerState',
  );

  logInfo(['makeTypesFromInitialServerState'], stdout, stderr);

  serverStateInterface = loadServerStateInterface();

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

      if (action === 'addEndpoint') {
        addEndpoint(payload as Endpoint);
        sendEvent(ws, 'updateEndpoints', endpoints);
      }

      if (action === 'updateEndpoint') {
        updateEndpoint(payload as Endpoint);
        sendEvent(ws, 'updateEndpoints', endpoints);
      }

      if (action === 'deleteEndpoint') {
        deleteEndpoint(payload as string);
        sendEvent(ws, 'updateEndpoints', endpoints);
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
      sendEvent(ws, 'updateEndpoints', endpoints);
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

        broadcast('updateServerState', serverState);

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
  })
  .listen(PORT, async listenSocket => {
    if (listenSocket) {
      logError(`Listening to port: ${PORT}`);
    }

    endpoints = await loadEndpoints();

    await makeTypesFromInitialServerState();
  });

// curl -i --header "Content-Type: application/json" --request GET  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request PUT  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request DELETE  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request PATCH --data '{ "requestCount": 12 }'  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request POST --data '{ "secret": true }'  http://localhost:5000/test
