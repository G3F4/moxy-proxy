import produce from 'immer';
import { Method } from '../../../sharedTypes';
import EndpointsService from '../endpoints-service/EndpointsService';
import ServerStateService from '../server-state-service/ServerStateService';

interface CallHandlerResponse {
  requestResponse: string;
  status: number;
  contentType: string;
}

export default class ApiService {
  constructor(
    readonly serverStateService: ServerStateService,
    readonly endpointsService: EndpointsService,
  ) {}

  callHandler(url: string, method: Method, requestBody: any = {}): CallHandlerResponse {
    const handler = this.endpointsService.getHandler({ url, method });
    const responseStatus = this.endpointsService.getEndpointResponseStatus({ url, method });
    const status = responseStatus ? responseStatus : 200;
    const requestObj = {
      body: requestBody,
    };
    const { requestResponse, serverUpdate } = handler;
    const requestResponseReturn = requestResponse(
      this.serverStateService.getServerState(),
      requestObj,
    );
    const state = produce(this.serverStateService.getServerState(), serverUpdate(requestObj));

    this.serverStateService.updateServerState({
      serverStateScenarioId: this.serverStateService.getActiveServerStateScenarioId(),
      state,
    });

    this.serverStateService.updateServerState({
      serverStateScenarioId: this.serverStateService.getActiveServerStateScenarioId(),
      state,
    });

    return {
      requestResponse: JSON.stringify(requestResponseReturn),
      status,
      contentType: 'json/application',
    };
  }
}
