import produce from 'immer';
import { Method } from '../../../sharedTypes';
import EndpointsService from '../endpoints-service/EndpointsService';
import ServerStateService from '../server-state-service/ServerStateService';

const defaultContentType = 'json/application';

interface CallHandlerArgs {
  url: string;
  method: Method;
  body: Record<string, unknown>;
  parameters: Record<string, string>;
}

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

  callHandler({
    url,
    method = 'get',
    body = {},
    parameters = {},
  }: CallHandlerArgs): CallHandlerResponse {
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

    this.serverStateService.updateServerState({
      serverStateScenarioId: this.serverStateService.getActiveServerStateScenarioId(),
      state: produce(
        this.serverStateService.getServerState(),
        serverUpdate(request),
      ),
    });

    return {
      status,
      contentType: defaultContentType,
      requestResponse: JSON.stringify(requestResponseReturn),
    };
  }
}
