import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import 'fastify-websocket';
import { ServerResponse } from 'http';
import { Method } from '../sharedTypes';
import { PORT } from './config';
import ApiService from './services/api-service/ApiService';
import FileService from './services/file-service/FileService';
import ServerStateService from './services/server-state-service/ServerStateService';
import SocketsService from './services/sockets-service/SocketsService';

export default class Application {
  constructor(
    private readonly server: FastifyInstance,
    private readonly serverStateService: ServerStateService,
    private readonly socketsService: SocketsService,
    private readonly fileService: FileService,
    private readonly apiService: ApiService,
  ) {}

  start() {
    this.registerRoutes();
    this.server.listen(PORT, this.listenHandler.bind(this));
  }

  private registerRoutes() {
    this.registerApiRoute();
    this.registerSocketsRoute();
  }

  private registerSocketsRoute() {
    const socketHash = 'superHash123';

    this.server.get(`/${socketHash}`, { websocket: true }, (connection, req) => {
      connection.socket.id = Date.now();
      this.socketsService.handleSocketConnected(connection.socket);

      connection.socket.on('message', (message: string) => {
        this.socketsService.handleClientMessage(message);
      });
      connection.socket.on('close', () => {
        this.socketsService.deleteSocket(connection.socket);
      });
    });
  }

  private registerApiRoute() {
    this.server.route({
      method: ['DELETE', 'GET', 'PATCH', 'POST', 'PUT'],
      url: '*',
      handler: this.rootController.bind(this),
    });
  }

  private rootController(request: FastifyRequest, reply: FastifyReply<ServerResponse>) {
    const IsFileRegex = /\.[0-9a-z]{1,5}$/i;
    const fileRequest = request.raw.url === '/' || IsFileRegex.test(request.raw.url!);

    if (fileRequest) {
      this.staticsController(request, reply);
    } else {
      this.apiController(request, reply);
    }
  }

  private apiController(request: FastifyRequest, reply: FastifyReply<ServerResponse>) {
    const method = request.raw.method!.toLowerCase() as Method;
    const url = request.raw.url!;
    const urlLastChar = url![url!.length - 1];
    const rawUrl = urlLastChar === '/' ? url!.slice(0, -1) : url;
    const { contentType, requestResponse, status } = this.apiService.callHandler(
      rawUrl,
      method,
      request.body,
    );

    reply
      .type(contentType)
      .code(status)
      .send(requestResponse);
  }

  private staticsController(request: FastifyRequest, reply: FastifyReply<ServerResponse>) {
    const contentTypeMap: Record<string, string> = {
      html: 'text/html',
      js: 'text/javascript',
      css: 'text/css',
      png: 'image/png',
      json: 'application/javascript',
      map: 'application/octet-stream',
    } as const;
    const filePath = request.raw.url !== '/' ? request.raw.url : '/index.html';
    const file = this.fileService.readText(`build${filePath}`);
    const parts = filePath!.split('.');
    const extension = parts[parts.length - 1];
    const contentType = contentTypeMap[extension];

    reply
      .type(contentType)
      .code(200)
      .send(file);
  }

  private async listenHandler(err: Error, address: string) {
    if (err) {
      this.server.log.error(err);
    }

    this.server.log.info(`server listening on ${address}`);

    await this.serverStateService.makeTypesFromInitialServerState();
    this.socketsService.sendServerStateInterface();
  }
}
