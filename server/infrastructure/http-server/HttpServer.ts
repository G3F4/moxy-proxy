import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import 'fastify-websocket';
import { SocketStream } from 'fastify-websocket';
import { ServerResponse } from 'http';
import { original } from 'parseurl';
import { parse } from 'querystring';
import { Method } from '../../../sharedTypes';
import ClientFacade from '../../domain/ClientFacade';
import { PORT } from '../../config';
import ApiService from '../../services/api-service/ApiService';
import FileManager from '../file-manager/FileManager';
import ServerStateService from '../../services/server-state-service/ServerStateService';
import SocketsClient from '../sockets-client/SocketsClient';

export default class HttpServer {
  constructor(
    private readonly server: FastifyInstance,
    private readonly serverStateService: ServerStateService,
    private readonly socketsClient: SocketsClient,
    private readonly fileManager: FileManager,
    private readonly apiService: ApiService,
    private readonly clientFacade: ClientFacade,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    server.register(require('fastify-cors'), {
      origin: true,
      credentials: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    server.register(require('fastify-websocket'), {
      handle: (conn: SocketStream) => {
        conn.pipe(conn); // creates an echo server
      },
      options: { maxPayload: 1048576 },
    });

    server.addContentTypeParser('*', { parseAs: 'string' }, function(
      req,
      body,
      done,
    ) {
      const contentType = req.headers['content-type'];

      if (contentType && contentType.startsWith('application')) {
        try {
          done(null, JSON.parse(body));
        } catch (err) {
          err.statusCode = 400;
          done(err, undefined);
        }
      }

      return body;
    });
  }

  start() {
    this.registerRoutes();
    this.server.listen(
      parseInt(PORT),
      '0.0.0.0',
      this.listenHandler.bind(this),
    );
  }

  private registerRoutes() {
    this.registerApiRoute();
    this.registerSocketsRoute();
  }

  private registerSocketsRoute() {
    const socketHash = 'superHash123';

    this.server.get(`/${socketHash}`, { websocket: true }, connection => {
      this.clientFacade.connectClient(connection.socket);
    });
  }

  private registerApiRoute() {
    this.server.route({
      method: ['DELETE', 'GET', 'PATCH', 'POST', 'PUT'],
      url: '*',
      handler: this.rootController.bind(this),
    });
  }

  private rootController(
    request: FastifyRequest,
    reply: FastifyReply<ServerResponse>,
  ) {
    const IsFileRegex = /\.[0-9a-z]{1,5}$/i;
    const fileRequest =
      request.raw.url === '/' || IsFileRegex.test(request.raw.url!);

    if (fileRequest) {
      this.staticsController(request, reply);
    } else {
      this.apiController(request, reply);
    }
  }

  private apiController(
    request: FastifyRequest,
    reply: FastifyReply<ServerResponse>,
  ) {
    const method = request.raw.method!.toLowerCase() as Method;
    const { pathname, query } = original(request.raw)!;
    let parameters = {};

    if (typeof query === 'string') {
      parameters = parse(query);
    }

    try {
      const {
        contentType,
        requestResponse,
        status,
      } = this.apiService.callHandler({
        url: pathname!,
        method,
        parameters,
        body: request.body,
      });

      reply
        .type(contentType)
        .code(status)
        .send(requestResponse);
    } catch (e) {
      reply.code(404).send(e.toString());
    }
  }

  private staticsController(
    request: FastifyRequest,
    reply: FastifyReply<ServerResponse>,
  ) {
    const contentTypeMap: Record<string, string> = {
      html: 'text/html',
      js: 'text/javascript',
      css: 'text/css',
      png: 'image/png',
      json: 'application/javascript',
      map: 'application/octet-stream',
    } as const;
    const filePath = request.raw.url !== '/' ? request.raw.url : '/index.html';
    const file = this.fileManager.readText(`build${filePath}`);
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
    // this.socketsClient.sendServerStateInterface();
  }
}
