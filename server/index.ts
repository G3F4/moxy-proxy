import { exec } from 'child_process';
import { readFileSync } from 'fs';
import produce from 'immer';
import * as util from 'util';
import { App, HttpRequest, HttpResponse, WebSocket } from 'uWebSockets.js';
import { PORT } from '../constans';
import { ServerState } from '../interfaces';
import {
  ClientAction,
  Endpoint,
  EndpointMapping,
  Method,
  ServerEvent,
  ServerStateScenario,
  ServerStateScenarioMapping,
} from '../sharedTypes';
import { fileService } from './FileService';
import createFolderIfNotExists from './utils/createFolderIfNotExists';
import { logError, logInfo } from './utils/logger';
import { nocache } from './utils/nocache';
import { readJsonAsync } from './utils/readJson';

const endpointsMapPath = 'data/endpoints.json';
let endpointMappings = fileService.readJSON<EndpointMapping[]>(endpointsMapPath);
let endpoints: Endpoint[] = [];

let activeServerStateScenarioId = 'default';
const initialServerStatePath = `data/serverState/${activeServerStateScenarioId}.json`;
const serverStateScenariosMapPath = 'data/serverStateScenarios.json';
const serverStateInterfaceFileName = 'interfaces.ts';
const serverStateInterfacePath = 'interfaces.ts';
const initialServerStates: Record<string, ServerState> = {
  default: loadServerState(initialServerStatePath),
};
let serverState = fileService.readJSON<ServerState>(initialServerStatePath);
let Sockets: WebSocket[] = [];
let serverStateInterface = fileService.readText(serverStateInterfacePath);
let serverStateScenarioMappings = fileService.readJSON<ServerStateScenarioMapping[]>(
  serverStateScenariosMapPath,
);

// Handler
export type RequestResponse = (state: ServerState, request: unknown) => unknown;
export type ServerUpdate = (request: unknown) => (state: ServerState) => void;

export interface Handler {
  requestResponse: RequestResponse;
  serverUpdate: ServerUpdate;
}

function handlerPath({ url, method }: Endpoint | EndpointMapping) {
  return `${fileService.cwd}/endpoints/${url}/${method}.js`;
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

// Creating types
const execPromised = util.promisify(exec);

async function makeTypesFromInitialServerState() {
  const { stdout, stderr } = await execPromised(
    `make_types -i ${serverStateInterfaceFileName} ${initialServerStatePath} ServerState`,
  );

  logInfo(['makeTypesFromInitialServerState'], stdout, stderr);

  serverStateInterface = fileService.readText(serverStateInterfacePath);

  broadcast({ action: 'updateServerStateInterface', payload: serverStateInterface });
}

// State related
function loadServerState(path: string) {
  return fileService.readJSON<ServerState>(path);
}

function getServerStateScenarioDataPath(scenario: ServerStateScenario) {
  return `data/serverState/${scenario.name}.json`;
}

function saveServerStateScenario(scenario: ServerStateScenario) {
  const serverStateScenarioDataPath = getServerStateScenarioDataPath(scenario);

  fileService.saveJSON(serverStateScenarioDataPath, scenario.state);
}

function saveServerStateScenarioMappings(scenarios: ServerStateScenarioMapping[]) {
  fileService.saveJSON(serverStateScenariosMapPath, scenarios);
}

function saveServerStateToFile(serverStateScenarioId: string, data: ServerState) {
  const serverStateScenarioMapping = serverStateScenarioMappings.find(
    scenario => scenario.id === serverStateScenarioId,
  );

  if (serverStateScenarioMapping) {
    fileService.saveJSON(serverStateScenarioMapping.path, data);
  }
}

function updateServerState({
  state,
  serverStateScenarioId,
}: {
  state: ServerState;
  serverStateScenarioId: string;
}) {
  logInfo(['updateServerState'], serverStateScenarioId);

  serverState = {
    ...serverState,
    ...state,
  };

  saveServerStateToFile(serverStateScenarioId, serverState);
  broadcast({ action: 'updateServerState', payload: serverState });
  makeTypesFromInitialServerState().then(() => {
    logInfo(['makeTypesFromInitialServerState'], 'done');
  });
}

function resetServerState(serverStateScenarioId: string) {
  logInfo(['resetServerState'], initialServerStates);
  updateServerState({
    serverStateScenarioId,
    state: initialServerStates[serverStateScenarioId],
  });
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

// Endpoints
function saveEndpointToFile(endpoint: Endpoint) {
  const code = handlerTemplate(endpoint);
  const folders = endpoint.url.split('/');

  folders.forEach((item, index, arr) => {
    const absolutePath = `endpoints/${arr.slice(0, index + 1).join('/')}`;

    createFolderIfNotExists(absolutePath);
  });

  const path = handlerPath(endpoint);
  const fileExists = fileService.checkIfExist(path);

  if (fileExists) {
    fileService.saveText(path, code);
  } else {
    fileService.saveText(path, code, { openToAppend: true });
  }
}

function saveEndpointMappings(data: EndpointMapping[]) {
  fileService.saveJSON(endpointsMapPath, data);
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

// Sockets
function sendEvent(socket: WebSocket, event: ServerEvent): void {
  try {
    socket.send(JSON.stringify(event));
    // logInfo(['sendEvent'], { action, payload });
  } catch (e) {
    logError(e);
  }
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
  addServerStateScenario(ws: WebSocket, payload: ServerStateScenario) {
    console.log(['addServerStateScenario'], payload);
    saveServerStateScenario(payload);

    serverStateScenarioMappings = [
      ...serverStateScenarioMappings,
      {
        name: payload.name,
        id: Date.now().toString(),
        path: getServerStateScenarioDataPath(payload),
      },
    ];

    saveServerStateScenarioMappings(serverStateScenarioMappings);
    broadcast({ action: 'updateServerStateScenarios', payload: serverStateScenarioMappings });
  },
  changeServerStateScenario(ws: WebSocket, payload: string) {
    const mapping = serverStateScenarioMappings.find(({ id }) => id === payload);

    if (mapping) {
      activeServerStateScenarioId = payload;

      const state = fileService.readJSON<ServerState>(mapping.path);

      if (!initialServerStates[mapping.id]) {
        initialServerStates[mapping.id] = state;
      }

      updateServerState({
        state,
        serverStateScenarioId: mapping.id,
      });
    }
  },
  clientUpdatedServer(
    ws: WebSocket,
    payload: { state: ServerState; serverStateScenarioId: string },
  ) {
    updateServerState(payload);
    broadcast({ action: 'updateServerState', payload: serverState });
  },
  deleteEndpoint(ws: WebSocket, payload: string) {
    deleteEndpoint(payload);
    sendEvent(ws, { action: 'updateEndpoints', payload: endpoints });
  },
  ping(ws: WebSocket, _payload: unknown) {},
  resetServerState(ws: WebSocket, payload: string) {
    resetServerState(payload);
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
  sendEvent(ws, { action: 'updateServerStateScenarios', payload: serverStateScenarioMappings });
  sendEvent(ws, { action: 'updateEndpoints', payload: endpoints });
}

function closeHandler(ws: WebSocket) {
  Sockets = Sockets.filter(socket => socket.id === ws.id);
}

const webSocketBehavior = {
  message: messageHandler,
  open: openHandler,
  close: closeHandler,
};

// Http
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
      const requestResponseReturn = requestResponse(serverState, request);
      const state = produce(serverState, serverUpdate(request));

      updateServerState({
        serverStateScenarioId: activeServerStateScenarioId,
        state,
      });

      res.end(JSON.stringify(requestResponseReturn));
    } else {
      const file = fileService.readText(`build${url}`);

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

// Application
App()
  .ws('/*', webSocketBehavior)
  .any('/*', httpHandler)
  .listen(PORT, startServerHandler);

// curl -i --header "Content-Type: application/json" --request GET  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request PUT  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request DELETE  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request PATCH --data '{ "requestCount": 12 }'  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request POST --data '{ "secret": true }'  http://localhost:5000/test
