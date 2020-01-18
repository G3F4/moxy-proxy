export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete' | '';

export interface Route {
  id: string;
  url: string;
  method: Method;
  responseCode: string;
  serverStateUpdateCode: string;
}
