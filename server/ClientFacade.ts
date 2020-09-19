import { ServerState } from '../interfaces';
import {
  ClientAction,
  Endpoint,
  HttpStatus,
  ServerStateScenario,
} from '../sharedTypes';
import EndpointsService from './services/endpoints-service/EndpointsService';
import ServerStateService from './services/server-state-service/ServerStateService';
import SocketsService from './services/sockets-service/SocketsService';

export default class ClientFacade {
  connectedSocketIds: string[] = [];

  constructor(
    private readonly socketsService: SocketsService,
    private readonly endpointsService: EndpointsService,
    private readonly serverStateService: ServerStateService,
  ) {}

  connectClient(socket: WebSocket) {
    const socketId = this.socketsService.connect(socket, this.disconnectClient);

    this.connectedSocketIds.push(socketId);
    this.socketsService.registerMessageHandlers(this.clientMessageHandlers);
    this.sendCurrentStateToClient(socketId);
  }

  sendServerStateInterface() {
    this.socketsService.broadcastEvent({
      action: 'updateServerStateInterface',
      payload: this.serverStateService.getServerStateInterface(),
    });
  }

  private disconnectClient(socketId: string) {
    this.connectedSocketIds = this.connectedSocketIds.filter(
      id => socketId !== id,
    );
  }

  private sendCurrentStateToClient(socketId: string) {
    this.socketsService.sendEventToSocket(socketId, {
      action: 'updateServerState',
      payload: this.serverStateService.getServerState(),
    });
    this.socketsService.sendEventToSocket(socketId, {
      action: 'updateServerStateInterface',
      payload: this.serverStateService.getServerStateInterface(),
    });
    this.socketsService.sendEventToSocket(socketId, {
      action: 'updateServerStateScenarios',
      payload: this.serverStateService.getServerStateScenarioMappings(),
    });
    this.socketsService.sendEventToSocket(socketId, {
      action: 'updateActiveStateScenarioId',
      payload: this.serverStateService.getActiveServerStateScenarioId(),
    });
    this.socketsService.sendEventToSocket(socketId, {
      action: 'updateEndpoints',
      payload: this.endpointsService.getEndpoints(),
    });
  }

  private clientMessageHandlers: Record<
    ClientAction,
    (payload: any) => void
  > = {
    persistMockedData: () => {
      this.serverStateService.persistChanges();
    },
    persistEndpoints: () => {
      this.endpointsService.persistChanges();
    },
    addEndpoint: (payload: Endpoint) => {
      this.endpointsService.addEndpoint(payload);
      this.socketsService.broadcastEvent({
        action: 'updateEndpoints',
        payload: this.endpointsService.getEndpoints(),
      });
    },
    updateEndpoint: (payload: Endpoint) => {
      this.endpointsService.updateEndpoint(payload);
      this.socketsService.broadcastEvent({
        action: 'updateEndpoints',
        payload: this.endpointsService.getEndpoints(),
      });
    },
    deleteEndpoint: (payload: string) => {
      this.endpointsService.deleteEndpoint(payload);
      this.socketsService.broadcastEvent({
        action: 'updateEndpoints',
        payload: this.endpointsService.getEndpoints(),
      });
    },
    changeEndpointResponseStatus: (payload: {
      endpointId: string;
      status: HttpStatus | null;
    }) => {
      this.endpointsService.changeEndpointResponseStatus(payload);
      this.socketsService.broadcastEvent({
        action: 'updateEndpoints',
        payload: this.endpointsService.getEndpoints(),
      });
    },

    addServerStateScenario: (payload: ServerStateScenario) => {
      this.serverStateService.addServerStateScenario(payload);
      this.socketsService.broadcastEvent({
        action: 'updateServerStateScenarios',
        payload: this.serverStateService.getServerStateScenarioMappings(),
      });
    },
    deleteStateScenario: (payload: string) => {
      this.serverStateService.deleteStateScenario(payload);
      this.socketsService.broadcastEvent({
        action: 'updateServerStateScenarios',
        payload: this.serverStateService.getServerStateScenarioMappings(),
      });
      this.socketsService.broadcastEvent({
        action: 'updateActiveStateScenarioId',
        payload: this.serverStateService.getActiveServerStateScenarioId(),
      });
    },
    changeServerStateScenario: (payload: string) => {
      console.log(['changeServerStateScenario'], payload);
      this.serverStateService.changeServerStateScenario(payload);
      this.socketsService.broadcastEvent({
        action: 'updateServerState',
        payload: this.serverStateService.getServerState(),
      });
    },
    clientUpdatedServer: (payload: {
      state: ServerState;
      serverStateScenarioId: string;
    }) => {
      this.serverStateService.updateScenarioState(payload);
      this.socketsService.broadcastEvent({
        action: 'updateServerState',
        payload: this.serverStateService.getServerState(),
      });
    },
    resetServerState: (payload: string) => {
      this.serverStateService.resetServerState(payload);
      this.socketsService.broadcastEvent({
        action: 'updateServerState',
        payload: this.serverStateService.getServerState(),
      });
    },

    ping: (_payload: unknown) => {},
  };
}
