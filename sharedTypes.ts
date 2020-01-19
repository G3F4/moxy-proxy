export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type ServerEvent = 'updateServerState' | 'updateServerStateInterface' | 'updateRoutes';

export type ClientEvent = 'addRoute' | 'updateRoute' | 'deleteRoute' | 'clientUpdatedServer' | 'resetServerState';

export interface Route {
  id: string;
  url: string;
  method: Method;
  responseCode: string;
  serverStateUpdateCode: string;
}
