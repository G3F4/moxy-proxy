//@ts-ignore
import * as WebSocket from 'ws';
import { ServerState } from '../../../interfaces';
import {
  ClientAction,
  Endpoint,
  HttpStatus,
  ServerEvent,
  ServerStateScenario,
} from '../../../sharedTypes';
import { logError } from '../../utils/logger';
import EndpointsService from '../endpoints-service/EndpointsService';
import ServerStateService from '../server-state-service/ServerStateService';

export default class SocketsService {
  sockets: WebSocket[] = [];

  constructor(
    readonly serverStateService: ServerStateService,
    readonly endpointsService: EndpointsService,
  ) {}

  handleSocketConnected(socket: WebSocket) {
    this.addSocket(socket);

    this.sendEvent(socket, {
      action: 'updateServerState',
      payload: this.serverStateService.getServerState(),
    });
    this.sendEvent(socket, {
      action: 'updateServerStateInterface',
      payload: this.serverStateService.getServerStateInterface(),
    });
    this.sendEvent(socket, {
      action: 'updateServerStateScenarios',
      payload: this.serverStateService.getServerStateScenarioMappings(),
    });
    this.sendEvent(socket, {
      action: 'updateEndpoints',
      payload: this.endpointsService.getEndpoints(),
    });
  }

  handleClientMessage(message: string) {
    const { action, payload } = this.parseClientMessage(message);
    const handler = this.clientMessageHandlers[action];

    handler(payload);
  }

  sendServerStateInterface() {
    this.broadcastEvent({
      action: 'updateServerStateInterface',
      payload: this.serverStateService.getServerStateInterface(),
    })
  }

  addSocket(socket: WebSocket) {
    this.sockets.push(socket);
  }

  deleteSocket(socket: WebSocket) {
    this.sockets = this.sockets.filter(({ id }) => id === socket.id);
  }

  sendEvent(socket: WebSocket, event: ServerEvent): void {
    try {
      socket.send(JSON.stringify(event));
    } catch (e) {
      logError(e);
    }
  }

  clearSocket(socketId: string) {
    this.sockets.filter(({ id }) => id === socketId);
  }

  broadcastEvent(event: ServerEvent) {
    this.sockets.forEach(socket => {
      try {
        socket.send(JSON.stringify(event));
      } catch (e) {
        logError(e);
        this.clearSocket(socket.id);
      }
    });
  }

  parseClientMessage(message: string): { action: ClientAction; payload: unknown } {
    const { action, payload } = JSON.parse(message);

    return { action, payload };
  }

  clientMessageHandlers: Record<ClientAction, (payload: any) => void> = {
    addEndpoint: (payload: Endpoint) => {
      this.endpointsService.addEndpoint(payload);
      this.broadcastEvent({
        action: 'updateEndpoints',
        payload: this.endpointsService.getEndpoints(),
      });
    },
    updateEndpoint: (payload: Endpoint) => {
      this.endpointsService.updateEndpoint(payload);
      this.broadcastEvent({
        action: 'updateEndpoints',
        payload: this.endpointsService.getEndpoints(),
      });
    },
    deleteEndpoint: (payload: string) => {
      this.endpointsService.deleteEndpoint(payload);
      this.broadcastEvent({
        action: 'updateEndpoints',
        payload: this.endpointsService.getEndpoints(),
      });
    },
    changeEndpointResponseStatus: (payload: { endpointId: string; status: HttpStatus | null }) => {
      this.endpointsService.changeEndpointResponseStatus(payload);
      this.broadcastEvent({
        action: 'updateEndpoints',
        payload: this.endpointsService.getEndpoints(),
      });
    },

    addServerStateScenario: (payload: ServerStateScenario) => {
      this.serverStateService.addServerStateScenario(payload);
      this.broadcastEvent({
        action: 'updateServerStateScenarios',
        payload: this.serverStateService.getServerStateScenarioMappings(),
      });
    },
    changeServerStateScenario: (payload: string) => {
      this.serverStateService.changeServerStateScenario(payload);
      this.broadcastEvent({
        action: 'updateServerState',
        payload: this.serverStateService.getServerState(),
      });
    },
    clientUpdatedServer: (
      payload: { state: ServerState; serverStateScenarioId: string },
    ) => {
      this.serverStateService.updateServerState(payload);
      this.broadcastEvent({
        action: 'updateServerState',
        payload: this.serverStateService.getServerState(),
      });
    },
    resetServerState: (payload: string) => {
      this.serverStateService.resetServerState(payload);
      this.broadcastEvent({
        action: 'updateServerState',
        payload: this.serverStateService.getServerState(),
      });
    },

    ping: (_payload: unknown) => {},
  };
}
