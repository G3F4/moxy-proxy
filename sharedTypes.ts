export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type ServerAction =
  | 'updateServerState'
  | 'updateServerStateInterface'
  | 'updateEndpoints'
  | 'updateServerStateScenarios';

interface SocketEvent {
  payload?: unknown;
}

export interface ServerEvent extends SocketEvent {
  action: ServerAction;
}

export type ClientAction =
  | 'ping'
  | 'addEndpoint'
  | 'updateEndpoint'
  | 'deleteEndpoint'
  | 'clientUpdatedServer'
  | 'resetServerState'
  | 'changeServerStateScenario'
  | 'changeEndpointResponseStatus'
  | 'addServerStateScenario';

export interface ClientEvent extends SocketEvent {
  action: ClientAction;
}

export interface Endpoint {
  id: string;
  url: string;
  method: Method;
  responseCode: string;
  serverStateUpdateCode: string;
  responseStatus: HttpStatus | null;
}

export interface EndpointMapping {
  id: string;
  url: string;
  method: Method;
}

export interface ServerStateScenario {
  id?: string;
  name: string;
  state: unknown;
}

export interface ServerStateScenarioMapping {
  id: string;
  name: string;
  path: string;
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
