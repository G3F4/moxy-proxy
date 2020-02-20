import { FSWatcher } from 'fs';
import { ServerState } from '../../../interfaces';
import { Endpoint, EndpointMapping, HttpStatus, Method } from '../../../sharedTypes';
import { logInfo } from '../../utils/logger';
import { nocache } from '../../utils/nocache';
import FileService from '../file-service/FileService';

export type RequestResponse = (state: ServerState, request: unknown) => unknown;
export type ServerUpdate = (request: unknown) => (state: ServerState) => void;

export interface Handler {
  requestResponse: RequestResponse;
  serverUpdate: ServerUpdate;
}

const urlParameterDelimiter = ':';

export default class EndpointsService {
  private endpoints: Endpoint[] = [];
  private endpointMappings: EndpointMapping[] = [];
  private dir: string = 'endpoints';
  private endpointMappingsFileName: string = 'endpoints.json';
  private handlersWatcher: Record<string, FSWatcher> = {};

  getEndpoints() {
    return this.endpoints;
  }

  getHandler({ method, url }: { method: Method; url: string }): Handler {
    const endpointMapping = this.endpointMappings.find(this.findEndpoint({ method, url }));

    if (endpointMapping) {
      return this.loadHandler(endpointMapping);
    }

    throw new Error(`no handler mapping for url: ${url} | method: ${method}`);
  }

  getUrlParameters({ method, url }: { method: Method; url: string }): Record<string, string> {
    const urlParts = url.split('/').filter(Boolean);
    const endpointMapping = this.endpointMappings.find(this.findEndpoint({ method, url }));

    if (endpointMapping) {
      const parts = endpointMapping.url.split('/').filter(Boolean);

      return parts.reduce((acc, part, partIndex) => {
        const urlParameter = part[0] === urlParameterDelimiter;

        if (urlParameter) {
          return {
            ...acc,
            [part.slice(1)]: urlParts[partIndex],
          }
        }

        return acc;
      }, {});
    }

    return {};
  }

  getEndpointResponseStatus({ method, url }: { method: Method; url: string }) {
    const endpointMapping = this.endpointMappings.find(this.findEndpoint({ method, url }));

    if (endpointMapping) {
      return endpointMapping.responseStatus;
    }

    return null;
  }

  constructor(readonly fileService: FileService) {
    this.loadEndpoints();
  }

  addEndpoint(endpoint: Endpoint) {
    logInfo(['addEndpoint'], endpoint);

    const endpointMapping: EndpointMapping = {
      id: Date.now().toString(),
      method: endpoint.method,
      url: endpoint.url,
      parameters: endpoint.parameters,
      responseStatus: endpoint.responseStatus,
    };

    this.endpoints = [...this.endpoints, endpoint];
    this.endpointMappings = [...this.endpointMappings, endpointMapping];

    this.saveEndpointMappings();
    this.saveEndpointToFile(endpoint);
  }

  deleteEndpoint(endpointId: string) {
    const endpoint =
      this.endpoints.find(it => it.id === endpointId) ||
      this.endpointMappings.find(it => it.id === endpointId);

    this.endpoints = this.endpoints.filter(({ id }) => id !== endpointId);
    this.endpointMappings = this.endpointMappings.filter(({ id }) => id !== endpointId);

    this.saveEndpointMappings();

    if (this.handlersWatcher[endpointId]) {
      this.handlersWatcher[endpointId].close();
      delete this.handlersWatcher[endpointId];
    }

    if (endpoint) {
      this.fileService.deleteFile(this.getEndpointPath(endpoint));
    }
  }

  updateEndpoint(endpoint: Endpoint) {
    const endpointIndex = this.endpoints.findIndex(
      ({ url, method }) => endpoint.url === url && endpoint.method === method,
    );

    this.endpoints[endpointIndex] = endpoint;

    logInfo(['updateEndpoint'], endpoint);

    this.saveEndpointToFile(endpoint);
  }

  changeEndpointResponseStatus({
    endpointId,
    status,
  }: {
    endpointId: string;
    status: HttpStatus | null;
  }) {
    const endpoint = this.endpoints.find(({ id }) => id === endpointId);
    const endpointMapping = this.endpointMappings.find(({ id }) => id === endpointId);

    if (endpoint && endpointMapping) {
      endpoint.responseStatus = status;
      endpointMapping.responseStatus = status;
    }

    this.saveEndpointMappings();
  }

  private findEndpoint({ method, url }: { method: Method; url: string }) {
    const urlParts = url.split('/').filter(Boolean);

    return (endpoint: EndpointMapping) => {
      const parts = endpoint.url.split('/').filter(Boolean);

      if (urlParts.length === parts.length && endpoint.method === method) {
        return parts.some(
          (part, urlPartIndex) =>
            part[0] === urlParameterDelimiter || part === urlParts[urlPartIndex],
        );
      }

      return false;
    }
  }

  private loadHandler(endpoint: Endpoint | EndpointMapping): Handler {
    const path = this.handlerPath(endpoint);
    const handlerExists = this.fileService.checkIfExist(path);

    if (!handlerExists) {
      throw new Error(`handler at path: ${path} not exists`);
    }

    const watcher = nocache(`${this.fileService.cwd}/${path}`);

    this.handlersWatcher = {
      ...this.handlersWatcher,
      [endpoint.id]: watcher,
    };

    return require(`${this.fileService.cwd}/${path}`);
  }

  private getEndpointPath(endpoint: Endpoint | EndpointMapping) {
    return `/${this.dir}/${endpoint.url}/${endpoint.method}.js`;
  }

  private getEndpointMappingsPath() {
    return `${this.dir}/${this.endpointMappingsFileName}`;
  }

  private loadEndpoints() {
    this.endpointMappings = this.fileService.readJSON<EndpointMapping[]>(
      this.getEndpointMappingsPath(),
    );
    this.endpoints = this.endpointMappings.reduce<EndpointMapping[]>((acc, endpointMapping) => {
      const { id, method, url, responseStatus, parameters } = endpointMapping;
      const handler = this.loadHandler(endpointMapping);

      if (handler) {
        const endpoint: Endpoint = {
          id,
          method,
          url,
          responseStatus,
          parameters,
          responseCode: handler.requestResponse.toString(),
          serverStateUpdateCode: handler.serverUpdate.toString(),
        };

        return [...acc, endpoint];
      } else {
        this.deleteEndpoint(endpointMapping.id);

        return acc;
      }
    }, []) as Endpoint[];
  }

  private saveEndpointMappings() {
    this.fileService.saveJSON(this.getEndpointMappingsPath(), this.endpointMappings);
  }

  private saveEndpointToFile(endpoint: Endpoint) {
    const code = this.handlerTemplate(endpoint);

    this.fileService.checkFolder(`${this.dir}/${endpoint.url}`);
    this.fileService.saveText(this.handlerPath(endpoint), code);
  }

  private handlerTemplate(endpoint: Endpoint) {
    return (
      `
export ${endpoint.responseCode.trim()}

export ${endpoint.serverStateUpdateCode.trim()}
`.trim() + '\n'
    );
  }

  private handlerPath({ url, method }: Endpoint | EndpointMapping) {
    return `${this.dir}/${url}/${method}.js`;
  }
}
