import produce from 'immer';
import {
  ClientAction,
  Endpoint,
  HttpStatus,
  Method,
  ServerState,
  ServerStateScenario,
} from '../../sharedTypes';
import SocketsClient from '../infrastructure/sockets-client/SocketsClient';
import EndpointsService from '../services/endpoints-service/EndpointsService';
import ServerStateService from '../services/server-state-service/ServerStateService';
import { logInfo } from '../utils/logger';

const DefaultContentType = 'json/application';

export default class MoxyProxyFacade {
  connectedSocketIds: string[] = [];

  constructor(
    private readonly socketsClient: SocketsClient,
    private readonly endpointsService: EndpointsService,
    private readonly serverStateService: ServerStateService,
  ) {}

  async loadServices() {
    await this.serverStateService.load();
    await this.endpointsService.load();
  }

  connectClient = async (socket: WebSocket) => {
    const socketId = this.socketsClient.connect(
      socket,
      this.disconnectClient.bind(this),
    );

    this.connectedSocketIds.push(socketId);
    this.socketsClient.registerMessageHandlers(this.clientMessageHandlers);
    await this.sendCurrentStateToClient(socketId);
  };

  async callHandler({
    url = '/',
    method = 'get',
    body = {},
    parameters = {},
  }: {
    url: string;
    method: Method;
    body: Record<string, unknown>;
    parameters: Record<string, unknown>;
  }): Promise<{
    status: HttpStatus;
    contentType: string;
    requestResponse: string;
  }> {
    console.log(['callHandler']);
    console.log(['method'], method);

    const handler = this.endpointsService.getHandler({ url, method });
    const urlParameters = this.endpointsService.getUrlParameters({
      url,
      method,
    });
    const responseStatus = this.endpointsService.getEndpointResponseStatus({
      url,
      method,
    });
    const status = responseStatus ? responseStatus : 200;
    const { requestResponse, serverUpdate } = handler;
    const request = { body, parameters, urlParameters };
    const requestResponseReturn = requestResponse(
      this.serverStateService.getServerState(),
      request,
    );

    await this.serverStateService.updateActiveScenario(
      produce(this.serverStateService.getServerState(), serverUpdate(request)),
    );
    await this.socketsClient.broadcastEvent({
      action: 'updateServerState',
      payload: this.serverStateService.getServerState(),
    });
    await this.socketsClient.broadcastEvent({
      action: 'updateServerStateInterface',
      payload: await this.serverStateService.getActiveScenarioInterface(),
    });

    return {
      status,
      contentType: DefaultContentType,
      requestResponse: JSON.stringify(requestResponseReturn),
    };
  }

  private disconnectClient(socketId: string) {
    this.connectedSocketIds = this.connectedSocketIds.filter(
      id => socketId !== id,
    );
  }

  private async sendCurrentStateToClient(socketId: string) {
    await this.socketsClient.sendEventToSocket(socketId, {
      action: 'updateServerState',
      payload: this.serverStateService.getServerState(),
    });
    await this.socketsClient.sendEventToSocket(socketId, {
      action: 'updateServerStateInterface',
      payload: await this.serverStateService.getActiveScenarioInterface(),
    });
    await this.socketsClient.sendEventToSocket(socketId, {
      action: 'updateServerStateScenarios',
      payload: this.serverStateService.getServerStateScenarioMappings(),
    });
    await this.socketsClient.sendEventToSocket(socketId, {
      action: 'updateActiveStateScenarioId',
      payload: this.serverStateService.getActiveServerStateScenarioId(),
    });
    await this.socketsClient.sendEventToSocket(socketId, {
      action: 'updateEndpoints',
      payload: this.endpointsService.getEndpoints(),
    });
  }

  private clientMessageHandlers: Record<
    ClientAction,
    (payload: any) => Promise<void>
  > = {
    persistMockedData: async () => {
      this.serverStateService.persistChanges();
    },
    persistEndpoints: async () => {
      this.endpointsService.persistChanges();
    },
    addEndpoint: async (payload: Endpoint) => {
      await this.endpointsService.addEndpoint(payload);
      await this.socketsClient.broadcastEvent({
        action: 'updateEndpoints',
        payload: this.endpointsService.getEndpoints(),
      });
    },
    updateEndpoint: async (payload: Endpoint) => {
      this.endpointsService.updateEndpoint(payload);
      await this.socketsClient.broadcastEvent({
        action: 'updateEndpoints',
        payload: this.endpointsService.getEndpoints(),
      });
    },
    deleteEndpoint: async (payload: string) => {
      this.endpointsService.deleteEndpoint(payload);
      await this.socketsClient.broadcastEvent({
        action: 'updateEndpoints',
        payload: this.endpointsService.getEndpoints(),
      });
    },
    changeEndpointResponseStatus: async (payload: {
      endpointId: string;
      status: HttpStatus | null;
    }) => {
      this.endpointsService.changeEndpointResponseStatus(payload);
      await this.socketsClient.broadcastEvent({
        action: 'updateEndpoints',
        payload: this.endpointsService.getEndpoints(),
      });
    },

    addServerStateScenario: async (payload: ServerStateScenario) => {
      await this.serverStateService.addServerStateScenario(payload);
      await this.socketsClient.broadcastEvent({
        action: 'updateServerStateScenarios',
        payload: this.serverStateService.getServerStateScenarioMappings(),
      });
    },
    deleteStateScenario: async (payload: string) => {
      await this.serverStateService.deleteStateScenario(payload);
      await this.socketsClient.broadcastEvent({
        action: 'updateServerStateScenarios',
        payload: this.serverStateService.getServerStateScenarioMappings(),
      });
      await this.socketsClient.broadcastEvent({
        action: 'updateActiveStateScenarioId',
        payload: this.serverStateService.getActiveServerStateScenarioId(),
      });
    },
    changeServerStateScenario: async (payload: string) => {
      console.log(['changeServerStateScenario'], payload);
      await this.serverStateService.changeServerStateScenario(payload);
      await this.socketsClient.broadcastEvent({
        action: 'updateServerState',
        payload: this.serverStateService.getServerState(),
      });
    },
    clientUpdatedServer: async (payload: {
      state: ServerState;
      serverStateScenarioId: string;
    }) => {
      await this.serverStateService.updateScenarioState(payload);
      await this.socketsClient.broadcastEvent({
        action: 'updateServerState',
        payload: this.serverStateService.getServerState(),
      });
      await this.socketsClient.broadcastEvent({
        action: 'updateServerStateInterface',
        payload: await this.serverStateService.getActiveScenarioInterface(),
      });
    },
    resetServerState: async (payload: string) => {
      await this.serverStateService.resetServerState(payload);
      await this.socketsClient.broadcastEvent({
        action: 'updateServerState',
        payload: this.serverStateService.getServerState(),
      });
    },

    ping: async () => {
      logInfo(['ping']);
    },
  };
}
