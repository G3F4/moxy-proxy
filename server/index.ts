import { FastifyInstance } from 'fastify';
import { SocketStream } from 'fastify-websocket';
import Application from './Application';
import ApiService from './services/api-service/ApiService';
import EndpointsService from './services/endpoints-service/EndpointsService';
import FileService from './services/file-service/FileService';
import ServerStateService from './services/server-state-service/ServerStateService';
import SocketsService from './services/sockets-service/SocketsService';

require('dotenv').config();

const fileService = new FileService(process.cwd());
const endpointsService = new EndpointsService(fileService);
const serverStateService = new ServerStateService(fileService);
const socketsService = new SocketsService(serverStateService, endpointsService);
const apiService = new ApiService(serverStateService, endpointsService);
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

fastify.addContentTypeParser(
  '*',
  { parseAs: 'string' },
  function(req, body, done) {
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
  },
);

const app = new Application(fastify, serverStateService, socketsService, fileService, apiService);

app.start();

// curl -i --header "Content-Type: application/json" --request GET  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request PUT  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request DELETE  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request PATCH --data '{ "requestCount": 12 }'  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request POST --data '{ "secret": true }'  http://localhost:5000/test
