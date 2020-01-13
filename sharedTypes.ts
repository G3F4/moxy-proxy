export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete' | '';

export interface Route {
  url: string;
  method: Method;
  responseCode: string;
  serverStateUpdateCode: string;
}