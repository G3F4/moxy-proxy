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
      handler: this.apiController.bind(this),
    });
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

  private async listenHandler(err: Error, address: string) {
    if (err) {
      this.server.log.error(err);
    }

    this.server.log.info(`server listening on ${address}`);

    await this.serverStateService.makeTypesFromInitialServerState();
    // this.socketsClient.sendServerStateInterface();
  }
}
