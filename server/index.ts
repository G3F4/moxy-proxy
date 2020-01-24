import { existsSync, readFileSync, writeFileSync } from 'fs';
import produce from 'immer';
import { App, HttpRequest, HttpResponse, WebSocket } from 'uWebSockets.js';
import { PORT } from '../constans';
import { ServerState } from '../interfaces';
import { ClientAction, Endpoint, Method, ServerEvent, ServerStateScenario } from '../sharedTypes';
import EndpointsService from './services/endpoints-service/EndpointsService';
import FileService from './services/file-service/FileService';
import ServerStateService from './services/server-state-service/ServerStateService';
import { logError, logInfo } from './utils/logger';
import { readJsonAsync } from './utils/readJson';

const fileService = new FileService(process.cwd(), readFileSync, writeFileSync, existsSync);
const endpointsService = new EndpointsService(fileService);
const serverStateService = new ServerStateService(fileService, broadcast);

// Sockets
let Sockets: WebSocket[] = [];

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
    broadcast({ action: 'updateEndpoints', payload: endpointsService.getEndpoints() });
  },
  updateEndpoint(ws: WebSocket, payload: Endpoint) {
    endpointsService.updateEndpoint(payload);
    broadcast({ action: 'updateEndpoints', payload: endpointsService.getEndpoints() });
  },
  deleteEndpoint(ws: WebSocket, payload: string) {
    endpointsService.deleteEndpoint(payload);
    broadcast({ action: 'updateEndpoints', payload: endpointsService.getEndpoints() });
  },

  addServerStateScenario(ws: WebSocket, payload: ServerStateScenario) {
    serverStateService.addServerStateScenario(payload);
    broadcast({
      action: 'updateServerStateScenarios',
      payload: serverStateService.getServerStateScenarioMappings(),
    });
  },
  changeServerStateScenario(ws: WebSocket, payload: string) {
    serverStateService.changeServerStateScenario(payload);
    broadcast({ action: 'updateServerState', payload: serverStateService.getServerState() });
  },
  clientUpdatedServer(
    ws: WebSocket,
    payload: { state: ServerState; serverStateScenarioId: string },
  ) {
    serverStateService.updateServerState(payload);
    broadcast({ action: 'updateServerState', payload: serverStateService.getServerState() });
  },
  resetServerState(ws: WebSocket, payload: string) {
    serverStateService.resetServerState(payload);
    broadcast({ action: 'updateServerState', payload: serverStateService.getServerState() });
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

  sendEvent(ws, { action: 'updateServerState', payload: serverStateService.getServerState() });
  sendEvent(ws, {
    action: 'updateServerStateInterface',
    payload: serverStateService.getServerStateInterface(),
  });
  sendEvent(ws, {
    action: 'updateServerStateScenarios',
    payload: serverStateService.getServerStateScenarioMappings(),
  });
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
      const requestResponseReturn = requestResponse(serverStateService.getServerState(), request);
      const state = produce(serverStateService.getServerState(), serverUpdate(request));

      serverStateService.updateServerState({
        serverStateScenarioId: serverStateService.getActiveServerStateScenarioId(),
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

  await serverStateService.makeTypesFromInitialServerState();
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
