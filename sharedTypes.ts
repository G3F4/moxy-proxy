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
}

export interface EndpointMapping {
  id: string;
  url: string;
  method: Method;
}

export type ServerStateScenarioId = 'default' | string;

export interface ServerStateScenario {
  id?: ServerStateScenarioId;
  name: string;
  state: unknown;
}

export interface ServerStateScenarioMapping {
  id: ServerStateScenarioId;
  name: string;
  path: string;
}
