import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { SocketStream } from 'fastify-websocket';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { ServerResponse } from 'http';
import produce from 'immer';
import { ServerState } from '../interfaces';
import { ClientAction, Endpoint, HttpStatus, Method, ServerStateScenario } from '../sharedTypes';
import EndpointsService from './services/endpoints-service/EndpointsService';
import FileService from './services/file-service/FileService';
import ServerStateService from './services/server-state-service/ServerStateService';
import SocketsService from './services/sockets-service/SocketsService';

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
const fastify: FastifyInstance = require('fastify')({
  logger: true,
});

fastify.register(require('fastify-cors'), {
  origin: true,
  credentials: true,
});

fastify.register(require('fastify-websocket'), {
  handle: (conn: SocketStream) => {
    conn.pipe(conn); // creates an echo server
  },
  options: { maxPayload: 1048576 },
});

const socketHash = 'superHash123';

fastify.get(`/${socketHash}`, { websocket: true }, (connection, req) => {
  connection.socket.id = Date.now();
  socketsService.addSocket(connection.socket);

  socketsService.sendEvent(connection.socket, {
    action: 'updateServerState',
    payload: serverStateService.getServerState(),
  });
  socketsService.sendEvent(connection.socket, {
    action: 'updateServerStateInterface',
    payload: serverStateService.getServerStateInterface(),
  });
  socketsService.sendEvent(connection.socket, {
    action: 'updateServerStateScenarios',
    payload: serverStateService.getServerStateScenarioMappings(),
  });
  socketsService.sendEvent(connection.socket, {
    action: 'updateEndpoints',
    payload: endpointsService.getEndpoints(),
  });

  connection.socket.on('message', (message: any) => {
    const { action, payload } = socketsService.parseClientMessage(message);
    const handler = clientMessageHandlers[action];

    handler(connection.socket, payload);
  });

  connection.socket.on('close', () => {
    socketsService.deleteSocket(connection.socket);
  });
});

const contentTypeMap: Record<string, string> = {
  html: 'text/html',
  js: 'text/javascript',
  css: 'text/css',
  png: 'image/png',
  json: 'application/javascript',
  map: 'application/octet-stream',
} as const;

function loadStaticFile(request: FastifyRequest, reply: FastifyReply<ServerResponse>) {
  const filePath = request.raw.url !== '/' ? request.raw.url : '/index.html';
  const file = fileService.readText(`build${filePath}`);
  const parts = filePath!.split('.');
  const extension = parts[parts.length - 1];
  const contentType = contentTypeMap[extension];

  reply
    .type(contentType)
    .code(200)
    .send(file);
}

const IsFileRegex = /\.[0-9a-z]{1,5}$/i;

fastify.route({
  method: ['DELETE', 'GET', 'PATCH', 'POST', 'PUT'],
  url: '*',
  handler: async function httpHandlerFast(request, reply) {
    const fileRequest = request.raw.url === '/' || IsFileRegex.test(request.raw.url!);

    if (fileRequest) {
      loadStaticFile(request, reply);
    } else {
      const method = request.raw.method!.toLowerCase() as Method;
      const url = request.raw.url;
      const urlLastChar = url![url!.length - 1];
      const rawUrl = urlLastChar === '/' ? url!.slice(0, -1) : url;
      const responseStatus = endpointsService.getEndpointResponseStatus({ url: rawUrl!, method });
      const contentType = request.headers['content-type'];
      const status = responseStatus ? responseStatus : 200;
      const handler = endpointsService.getHandler({ url: rawUrl!, method });

      reply.type(contentType).code(status);

      if (handler) {
        const requestObj = {
          body: request.body,
        };
        const { requestResponse, serverUpdate } = handler;
        const requestResponseReturn = requestResponse(
          serverStateService.getServerState(),
          requestObj,
        );
        const state = produce(serverStateService.getServerState(), serverUpdate(requestObj));

        serverStateService.updateServerState({
          serverStateScenarioId: serverStateService.getActiveServerStateScenarioId(),
          state,
        });

        reply.send(JSON.stringify(requestResponseReturn));
      } else {
        reply.send('No handler');
      }
    }
  },
});

fastify.listen(5000, async (err, address) => {
  if (err) throw err;

  fastify.log.info(`server listening on ${address}`);

  await serverStateService.makeTypesFromInitialServerState();
});

// curl -i --header "Content-Type: application/json" --request GET  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request PUT  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request DELETE  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request PATCH --data '{ "requestCount": 12 }'  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request POST --data '{ "secret": true }'  http://localhost:5000/test
