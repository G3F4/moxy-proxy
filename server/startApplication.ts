import { FastifyInstance } from 'fastify';
import Application from './Application';
import ApiService from './services/api-service/ApiService';
import EndpointsService from './services/endpoints-service/EndpointsService';
import FileService from './services/file-service/FileService';
import ServerStateService from './services/server-state-service/ServerStateService';
import SocketsService from './services/sockets-service/SocketsService';

const fileService = new FileService(process.cwd());
const endpointsService = new EndpointsService(fileService);
const serverStateService = new ServerStateService(fileService);
const socketsService = new SocketsService(
  fileService,
  serverStateService,
  endpointsService,
);
const apiService = new ApiService(serverStateService, endpointsService);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fastify: FastifyInstance = require('fastify')({
  logger: true,
});

export default function startApplication() {
  const app = new Application(
    fastify,
    serverStateService,
    socketsService,
    fileService,
    apiService,
  );

  app.start();

  return fastify;
}
