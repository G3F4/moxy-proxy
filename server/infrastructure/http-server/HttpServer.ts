/* eslint-disable @typescript-eslint/no-var-requires */
import { FastifyInstance } from 'fastify';
import 'fastify-websocket';
import { SocketStream } from 'fastify-websocket';
import { RouteHandlerMethod } from 'fastify/types/route';
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

    this.server.get(
      `/${socketHash}`,
      { websocket: true },
      async (connection) => {
        await this.moxyProxyFacade.connectClient(connection.socket);
      },
    );
  }

  private registerRestRoute() {
    this.server.route({
      method: ['DELETE', 'GET', 'PATCH', 'POST', 'PUT'],
      url: '*',
      // @ts-ignore
      handler: this.restController.bind(this),
    });
  }

  private static parseMethod(method: string): Method {
    const correctMethods = ['get', 'post', 'put', 'patch', 'delete', 'options'];

    if (correctMethods.includes(method)) {
      return method as Method;
    }

    throw new Error('Incorrect method');
  }

  private static parseUrl(url: string | null): string {
    if (url) {
      return url;
    }

    throw new Error('Incorrect url');
  }

  restController: RouteHandlerMethod = async (request, reply) => {
    const method = request.raw.method;
    const parsedUrl = original(request.raw);

    if (method && parsedUrl) {
      const { pathname, query } = parsedUrl;
      let parameters = {};

      if (typeof query === 'string') {
        parameters = parse(query);
      }

      const {
        contentType,
        requestResponse,
        status,
      } = await this.moxyProxyFacade.callHandler({
        parameters,
        url: HttpServer.parseUrl(pathname),
        body: request.body as Record<string, unknown>,
        method: HttpServer.parseMethod(method),
      });

      reply.type(contentType).code(status).send(requestResponse);
    }

    throw new Error('Wrong rest controller request');
  };

  private async listenHandler(err: Error) {
    if (err) {
      this.server.log.error(err);
    }
  }
}
