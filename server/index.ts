import { exec } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import produce from 'immer';
import * as util from 'util';
import { App, HttpRequest, HttpResponse, WebSocket } from 'uWebSockets.js';
import { PORT } from '../constans';
import { ServerState } from '../interfaces';
import {
  ClientAction,
  Endpoint,
  Method,
  ServerEvent,
  ServerStateScenario,
  ServerStateScenarioMapping,
} from '../sharedTypes';
import EndpointsService from './services/endpoints-service/EndpointsService';
import FileService from './services/file-service/FileService';
import { logError, logInfo } from './utils/logger';
import { readJsonAsync } from './utils/readJson';

const fileService = new FileService(process.cwd(), readFileSync, writeFileSync, existsSync);
const endpointsService = new EndpointsService(fileService);

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
    endpointsService.addEndpoint(payload);
    sendEvent(ws, { action: 'updateEndpoints', payload: endpointsService.getEndpoints() });
  },
  updateEndpoint(ws: WebSocket, payload: Endpoint) {
    endpointsService.updateEndpoint(payload);
    sendEvent(ws, { action: 'updateEndpoints', payload: endpointsService.getEndpoints() });
  },
  deleteEndpoint(ws: WebSocket, payload: string) {
    endpointsService.deleteEndpoint(payload);
    sendEvent(ws, { action: 'updateEndpoints', payload: endpointsService.getEndpoints() });
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
  resetServerState(ws: WebSocket, payload: string) {
    resetServerState(payload);
    sendEvent(ws, { action: 'updateServerState', payload: serverState });
  },

  ping(ws: WebSocket, _payload: unknown) {},
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
  sendEvent(ws, { action: 'updateEndpoints', payload: endpointsService.getEndpoints() });
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
    const handler = endpointsService.getHandler({ url: rawUrl, method });

    logInfo(['url'], url);
    logInfo(['method'], method);

    if (handler) {
      const requestBody = await readJsonAsync(res);
      const request = {
        body: requestBody,
      };
      const { requestResponse, serverUpdate } = handler;
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
