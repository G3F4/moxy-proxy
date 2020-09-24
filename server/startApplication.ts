import MoxyProxyFacade from './domain/MoxyProxyFacade';
import FileManager from './infrastructure/file-manager/FileManager';
import HttpServer from './infrastructure/http-server/HttpServer';
import SocketsClient from './infrastructure/sockets-client/SocketsClient';
import EndpointsService from './services/endpoints-service/EndpointsService';
import ServerStateService from './services/server-state-service/ServerStateService';

const fileManager = new FileManager();
const socketsClient = new SocketsClient();
const endpointsService = new EndpointsService(fileManager);
const serverStateService = new ServerStateService(fileManager);
const moxyProxyFacade = new MoxyProxyFacade(
  socketsClient,
  endpointsService,
  serverStateService,
);

export default async function startApplication() {
  await moxyProxyFacade.loadServices();
  new HttpServer(moxyProxyFacade);
}
