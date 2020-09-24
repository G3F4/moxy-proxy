export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options';

export type ServerAction =
  | 'updateEndpoints'
  | 'updateServerState'
  | 'updateServerStateInterface'
  | 'updateActiveStateScenarioId'
  | 'updateServerStateScenarios';

interface SocketEvent {
  payload?: any;
}

export interface ServerEvent extends SocketEvent {
  action: ServerAction;
}

export type ClientAction =
  | 'ping'
  | 'persistEndpoints'
  | 'persistMockedData'
  | 'addEndpoint'
  | 'updateEndpoint'
  | 'deleteEndpoint'
  | 'clientUpdatedServer'
  | 'deleteStateScenario'
  | 'resetServerState'
  | 'changeServerStateScenario'
  | 'changeEndpointResponseStatus'
  | 'addServerStateScenario';

export interface ClientEvent extends SocketEvent {
  action: ClientAction;
}

export interface EndpointParameter {
  id: string;
  name: string;
  type: string;
}

export interface Endpoint extends EndpointMapping {
  responseCode: string;
  serverStateUpdateCode: string;
}

export interface EndpointMapping {
  id: string;
  url: string;
  method: Method;
  responseStatus: HttpStatus | null;
  parameters: EndpointParameter[];
}

export type ServerState = JSON;

export interface ServerStateScenario {
  id: string;
  name: string;
  state: ServerState;
}

export interface ServerStateScenarioMapping {
  id: string;
  name: string;
  path: string | null;
}

export type HttpStatus =
  | 100
  | 101
  | 102
  | 200
  | 201
  | 202
  | 203
  | 204
  | 205
  | 206
  | 207
  | 208
  | 226
  | 300
  | 301
  | 302
  | 303
  | 304
  | 305
  | 307
  | 308
  | 400
  | 401
  | 402
  | 403
  | 404
  | 405
  | 406
  | 407
  | 408
  | 409
  | 410
  | 411
  | 412
  | 413
  | 414
  | 415
  | 416
  | 417
  | 418
  | 421
  | 422
  | 423
  | 424
  | 426
  | 428
  | 429
  | 431
  | 444
  | 451
  | 499
  | 500
  | 501
  | 502
  | 503
  | 504
  | 505
  | 506
  | 507
  | 508
  | 510
  | 511
  | 599;

export interface HttpStatusOption {
  text: string;
  value: HttpStatus;
}
