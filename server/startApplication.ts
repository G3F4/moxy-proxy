import { FastifyInstance } from 'fastify';
import HttpServer from './infrastructure/http-server/HttpServer';
import ClientFacade from './domain/ClientFacade';
import ApiService from './services/api-service/ApiService';
import EndpointsService from './services/endpoints-service/EndpointsService';
import FileManager from './infrastructure/file-manager/FileManager';
import ServerStateService from './services/server-state-service/ServerStateService';
import SocketsClient from './infrastructure/sockets-client/SocketsClient';

const fileManager = new FileManager(process.cwd());
const endpointsService = new EndpointsService(fileManager);
const serverStateService = new ServerStateService(fileManager);
const socketsClient = new SocketsClient();
const apiService = new ApiService(serverStateService, endpointsService);
const clientFacade = new ClientFacade(
  socketsClient,
  endpointsService,
  serverStateService,
);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fastify: FastifyInstance = require('fastify')({
  logger: true,
});

export default function startApplication() {
  const app = new HttpServer(
    fastify,
    serverStateService,
    socketsClient,
    fileManager,
    apiService,
    clientFacade,
  );

  app.start();

  return fastify;
}
