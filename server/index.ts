import { existsSync, readFileSync, writeFileSync } from 'fs';
import produce from 'immer';
import { App, HttpRequest, HttpResponse, WebSocket } from 'uWebSockets.js';
import { PORT } from '../constans';
import { ServerState } from '../interfaces';
import { ClientAction, Endpoint, HttpStatus, Method, ServerStateScenario } from '../sharedTypes';
import EndpointsService from './services/endpoints-service/EndpointsService';
import FileService from './services/file-service/FileService';
import ServerStateService from './services/server-state-service/ServerStateService';
import SocketsService from './services/sockets-service/SocketsService';
import { logError, logInfo } from './utils/logger';
import { readJsonAsync } from './utils/readJson';

const socketsService = new SocketsService();
const fileService = new FileService(process.cwd(), readFileSync, writeFileSync, existsSync);
const endpointsService = new EndpointsService(fileService);
const serverStateService = new ServerStateService(fileService, socketsService);
const clientMessageHandlers: Record<ClientAction, (ws: WebSocket, payload: any) => void> = {
  addEndpoint(ws: WebSocket, payload: Endpoint) {
    endpointsService.addEndpoint(payload);
    socketsService.broadcastEvent({
      action: 'updateEndpoints',
      payload: endpointsService.getEndpoints(),
    });
  },
  updateEndpoint(ws: WebSocket, payload: Endpoint) {
    endpointsService.updateEndpoint(payload);
    socketsService.broadcastEvent({
      action: 'updateEndpoints',
      payload: endpointsService.getEndpoints(),
    });
  },
  deleteEndpoint(ws: WebSocket, payload: string) {
    endpointsService.deleteEndpoint(payload);
    socketsService.broadcastEvent({
      action: 'updateEndpoints',
      payload: endpointsService.getEndpoints(),
    });
  },
  changeEndpointResponseStatus(
    ws: WebSocket,
    payload: { endpointId: string; status: HttpStatus | null },
  ) {
    endpointsService.changeEndpointResponseStatus(payload);
    socketsService.broadcastEvent({
      action: 'updateEndpoints',
      payload: endpointsService.getEndpoints(),
    });
  },

  addServerStateScenario(ws: WebSocket, payload: ServerStateScenario) {
    serverStateService.addServerStateScenario(payload);
    socketsService.broadcastEvent({
      action: 'updateServerStateScenarios',
      payload: serverStateService.getServerStateScenarioMappings(),
    });
  },
  changeServerStateScenario(ws: WebSocket, payload: string) {
    serverStateService.changeServerStateScenario(payload);
    socketsService.broadcastEvent({
      action: 'updateServerState',
      payload: serverStateService.getServerState(),
    });
  },
  clientUpdatedServer(
    ws: WebSocket,
    payload: { state: ServerState; serverStateScenarioId: string },
  ) {
    serverStateService.updateServerState(payload);
    socketsService.broadcastEvent({
      action: 'updateServerState',
      payload: serverStateService.getServerState(),
    });
  },
  resetServerState(ws: WebSocket, payload: string) {
    serverStateService.resetServerState(payload);
    socketsService.broadcastEvent({
      action: 'updateServerState',
      payload: serverStateService.getServerState(),
    });
  },

  ping(ws: WebSocket, _payload: unknown) {},
};

function messageHandler(ws: WebSocket, message: ArrayBuffer) {
  const { action, payload } = socketsService.parseClientMessage(message);
  const handler = clientMessageHandlers[action];

  handler(ws, payload);
}

function openHandler(ws: WebSocket) {
  ws.id = Date.now();
  socketsService.addSocket(ws);

  socketsService.sendEvent(ws, {
    action: 'updateServerState',
    payload: serverStateService.getServerState(),
  });
  socketsService.sendEvent(ws, {
    action: 'updateServerStateInterface',
    payload: serverStateService.getServerStateInterface(),
  });
  socketsService.sendEvent(ws, {
    action: 'updateServerStateScenarios',
    payload: serverStateService.getServerStateScenarioMappings(),
  });
  socketsService.sendEvent(ws, {
    action: 'updateEndpoints',
    payload: endpointsService.getEndpoints(),
  });
}

function closeHandler(ws: WebSocket) {
  socketsService.deleteSocket(ws);
}

const webSocketBehavior = {
  message: messageHandler,
  open: openHandler,
  close: closeHandler,
};

// Http
async function httpHandler(res: HttpResponse, req: HttpRequest) {
  logInfo(['httpHandler']);

  try {
    const method = req.getMethod() as Method;
    const url = req.getUrl() !== '/' ? req.getUrl() : '/index.html';
    const urlLastChar = url[url.length - 1];
    const rawUrl = urlLastChar === '/' ? url.slice(0, -1) : url;
    const responseStatus = endpointsService.getEndpointResponseStatus({ url: rawUrl, method });
    const contentType = req.getHeader('content-type');
    const status = responseStatus ? responseStatus.toString() : '200';

    if (contentType) {
      logInfo(['Content-Type'], contentType);
      res.writeHeader('content-type', contentType)
    }

    res.writeStatus(status);
    enableCors(res, req);

    const handler = endpointsService.getHandler({ url: rawUrl, method });

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

      return res.end(JSON.stringify(requestResponseReturn));
    } else {
      const file = fileService.readText(`build${url}`);

      return res.end(file);
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

function enableCors(res: HttpResponse, req: HttpRequest) {
  const origin = req.getHeader('origin');

  if (origin.length > 0) {
    res.writeHeader('Access-Control-Allow-Origin', origin);
    res.writeHeader('Access-Control-Allow-Credentials', 'true');
  }

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
