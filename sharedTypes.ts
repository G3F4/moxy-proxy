export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type ServerEvent = 'updateServerState' | 'updateServerStateInterface' | 'updateEndpoints';

export type ClientEvent = 'addEndpoint' | 'updateEndpoint' | 'deleteEndpoint' | 'clientUpdatedServer' | 'resetServerState';

export interface Endpoint {
  id: string;
  url: string;
  method: Method;
  responseCode: string;
  serverStateUpdateCode: string;
}
