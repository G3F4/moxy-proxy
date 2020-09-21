/* eslint-disable @typescript-eslint/no-var-requires */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import 'fastify-websocket';
import { SocketStream } from 'fastify-websocket';
import { ServerResponse } from 'http';
import { original } from 'parseurl';
import { parse } from 'querystring';
import { Method } from '../../../sharedTypes';
import { PORT } from '../../config';
import MoxyProxyFacade from '../../domain/MoxyProxyFacade';

export default class HttpServer {
  private server: FastifyInstance;

  constructor(private readonly moxyProxyFacade: MoxyProxyFacade) {
    this.server = require('fastify')({
      logger: true,
    });
    this.server.register(require('fastify-cors'), {
      origin: true,
      credentials: true,
    });
    this.server.register(require('fastify-websocket'), {
      handle: (conn: SocketStream) => {
        conn.pipe(conn); // creates an echo server
      },
      options: { maxPayload: 1048576 },
    });
    this.registerRoutes();
    this.server.listen(
      parseInt(PORT),
      '0.0.0.0',
      this.listenHandler.bind(this),
    );
  }

  private registerRoutes() {
    this.registerRestRoute();
    this.registerSocketsRoute();
  }

  private registerSocketsRoute() {
    const socketHash = 'superHash123';

    this.server.get(`/${socketHash}`, { websocket: true }, connection => {
      this.moxyProxyFacade.connectClient(connection.socket);
    });
  }

  private registerRestRoute() {
    this.server.route({
      method: ['DELETE', 'GET', 'PATCH', 'POST', 'PUT'],
      url: '*',
      // @ts-ignore
      handler: this.restController.bind(this),
    });
  }

  private restController(
    request: FastifyRequest,
    // @ts-ignore
    reply: FastifyReply<ServerResponse>,
  ) {
    const method = request.raw.method!.toLowerCase() as Method;
    const { pathname, query } = original(request.raw)!;
    let parameters = {};

    if (typeof query === 'string') {
      parameters = parse(query);
    }

    const {
      contentType,
      requestResponse,
      status,
    } = this.moxyProxyFacade.callHandler({
      method,
      parameters,
      url: pathname!,
      body: request.body as Record<string, any>,
    });

    reply
      .type(contentType)
      .code(status)
      .send(requestResponse);
  }

  private async listenHandler(err: Error, address: string) {
    if (err) {
      this.server.log.error(err);
    }
  }
}
