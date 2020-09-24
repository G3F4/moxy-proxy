import { FSWatcher } from 'fs';
import { ServerState } from '../../../interfaces';
import {
  Endpoint,
  EndpointMapping,
  HttpStatus,
  Method,
} from '../../../sharedTypes';
import { DATA_DIR } from '../../config';
import FileManager from '../../infrastructure/file-manager/FileManager';
import { logInfo } from '../../utils/logger';
import { nocache } from '../../utils/nocache';

function handlerTemplate(endpoint: Endpoint) {
  return (
    `
${endpoint.responseCode.trim()}

${endpoint.serverStateUpdateCode.trim()}

module.exports = { requestResponse, serverUpdate };
`.trim() + '\n'
  );
}

export type RequestResponse = (state: ServerState, request: unknown) => unknown;
export type ServerUpdate = (request: unknown) => (state: ServerState) => void;

export interface Handler {
  requestResponse: RequestResponse;
  serverUpdate: ServerUpdate;
}

const urlParameterDelimiter = ':';

export default class EndpointsService {
  constructor(readonly fileManager: FileManager) {
    this.loadEndpoints();
  }

  getEndpoints() {
    return this.endpoints;
  }

  getHandler({ method, url }: { method: Method; url: string }): Handler {
    const endpoint = this.endpoints.find(this.findEndpoint({ method, url }));

    logInfo(['getHandler'], endpoint);

    if (endpoint) {
      const { responseCode, serverStateUpdateCode } = endpoint;
      const responseCodeLines = responseCode.split('\n').filter(line => line);
      const serverStateUpdateCodeLines = serverStateUpdateCode
        .split('\n')
        .filter(line => line);
      const responseCodeBody = responseCodeLines
        .slice(1, responseCodeLines.length - 1)
        .join('\n');
      const serverStateUpdateCodeBody = serverStateUpdateCodeLines
        .slice(1, serverStateUpdateCodeLines.length - 1)
        .join('\n');
      const responseFunction = new Function(
        'state',
        'request',
        responseCodeBody,
      ) as RequestResponse;
      const serverStateUpdateFunction = new Function(
        'request',
        serverStateUpdateCodeBody,
      ) as ServerUpdate;

      return {
        requestResponse: responseFunction,
        serverUpdate: serverStateUpdateFunction,
      };
    }

    throw new Error(
      `no endpoint definition for url: ${url} | method: ${method}`,
    );
  }

  getUrlParameters({
    method,
    url,
  }: {
    method: Method;
    url: string;
  }): Record<string, string> {
    const urlParts = url.split('/').filter(Boolean);
    const endpointMapping = this.endpointMappings.find(
      this.findEndpoint({ method, url }),
    );

    if (endpointMapping) {
      const parts = endpointMapping.url.split('/').filter(Boolean);

      return parts.reduce((acc, part, partIndex) => {
        const urlParameter = part[0] === urlParameterDelimiter;

        if (urlParameter) {
          return {
            ...acc,
            [part.slice(1)]: urlParts[partIndex],
          };
        }

        return acc;
      }, {});
    }

    return {};
  }

  getEndpointResponseStatus({ method, url }: { method: Method; url: string }) {
    const endpointMapping = this.endpointMappings.find(
      this.findEndpoint({ method, url }),
    );

    if (endpointMapping) {
      return endpointMapping.responseStatus;
    }

    return null;
  }

  addEndpoint(endpoint: Endpoint) {
    logInfo(['addEndpoint'], endpoint);

    const endpointMapping: EndpointMapping = {
      id: endpoint.id,
      method: endpoint.method,
      url: endpoint.url.slice(1),
      parameters: endpoint.parameters,
      responseStatus: endpoint.responseStatus,
    };

    if (!this.checkIfEndpointAlreadyExists(endpointMapping)) {
      this.endpoints = [
        ...this.endpoints,
        { ...endpoint, url: endpointMapping.url },
      ];
      this.endpointMappings = [...this.endpointMappings, endpointMapping];
    }
  }

  deleteEndpoint(endpointId: string) {
    console.log(['deleteEndpoint'], endpointId);

    const endpoint =
      this.endpoints.find(it => it.id === endpointId) ||
      this.endpointMappings.find(it => it.id === endpointId);

    this.endpoints = this.endpoints.filter(({ id }) => id !== endpointId);
    this.endpointMappings = this.endpointMappings.filter(
      ({ id }) => id !== endpointId,
    );

    this.saveEndpointMappings();

    if (this.handlersWatcher[endpointId]) {
      this.handlersWatcher[endpointId].close();
      delete this.handlersWatcher[endpointId];
    }

    if (endpoint) {
      this.fileManager.deleteFile(this.getEndpointPath(endpoint));
    }
  }

  updateEndpoint(endpoint: Endpoint) {
    logInfo(['updateEndpoint'], endpoint);

    const endpointIndex = this.endpoints.findIndex(
      ({ url, method }) => endpoint.url === url && endpoint.method === method,
    );

    this.endpoints[endpointIndex] = endpoint;
  }

  changeEndpointResponseStatus({
    endpointId,
    status,
  }: {
    endpointId: string;
    status: HttpStatus | null;
  }) {
    const endpoint = this.endpoints.find(({ id }) => id === endpointId);
    const endpointMapping = this.endpointMappings.find(
      ({ id }) => id === endpointId,
    );

    if (endpoint && endpointMapping) {
      endpoint.responseStatus = status;
      endpointMapping.responseStatus = status;
    }

    this.saveEndpointMappings();
  }

  persistChanges() {
    logInfo(['persistChanges']);
    this.saveEndpointMappings();
    this.endpoints.forEach(this.saveEndpointToFile.bind(this));
  }

  private endpoints: Endpoint[] = [];
  private endpointMappings: EndpointMapping[] = [];
  private dir = `${DATA_DIR}/endpoints`;
  private endpointMappingsFileName = `endpoints.json`;
  private handlersWatcher: Record<string, FSWatcher> = {};

  private checkIfEndpointAlreadyExists({ method, url }: EndpointMapping) {
    const endpointMapping = this.endpointMappings.find(
      this.findEndpoint({ method, url }),
    );

    return Boolean(endpointMapping);
  }

  private findEndpoint({ method, url }: { method: Method; url: string }) {
    const urlParts = url.split('/').filter(Boolean);

    return (endpoint: EndpointMapping) => {
      const parts = endpoint.url.split('/').filter(Boolean);

      if (urlParts.length === parts.length && endpoint.method === method) {
        return parts.every(
          (part, urlPartIndex) =>
            part[0] === urlParameterDelimiter ||
            part === urlParts[urlPartIndex],
        );
      }

      return false;
    };
  }

  private loadHandler(endpointMapping: EndpointMapping): Handler {
    const path = this.handlerPath(endpointMapping);
    const handlerExists = this.fileManager.checkIfExists(path);

    if (!handlerExists) {
      throw new Error(`handler at path: ${path} not exists`);
    }

    const watcher = nocache(`${this.fileManager.cwd}/${path}`);

    this.handlersWatcher = {
      ...this.handlersWatcher,
      [endpointMapping.id]: watcher,
    };

    return require(`${this.fileManager.cwd}/${path}`);
  }

  private getEndpointPath(endpoint: Endpoint | EndpointMapping) {
    return `/${this.dir}/${endpoint.url}/${endpoint.method}.js`;
  }

  private getEndpointMappingsPath() {
    return `${this.dir}/${this.endpointMappingsFileName}`;
  }

  private loadEndpoints() {
    const savedMappingsExists = this.fileManager.checkIfExists(
      this.getEndpointMappingsPath(),
    );

    if (savedMappingsExists) {
      this.endpointMappings = this.fileManager.readJSON<EndpointMapping[]>(
        this.getEndpointMappingsPath(),
      );
      this.endpoints = this.endpointMappings.reduce<EndpointMapping[]>(
        (acc, endpointMapping) => {
          const {
            id,
            method,
            url,
            responseStatus,
            parameters,
          } = endpointMapping;
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
        },
        [],
      ) as Endpoint[];
    }
  }

  private saveEndpointMappings() {
    this.fileManager.saveJSON(
      this.getEndpointMappingsPath(),
      this.endpointMappings,
    );
  }

  private saveEndpointToFile(endpoint: Endpoint) {
    const code = handlerTemplate(endpoint);

    this.fileManager.checkFolder(`${this.dir}/${endpoint.url}`);
    this.fileManager.saveText(this.handlerPath(endpoint), code);
  }

  private handlerPath({ url, method }: Endpoint | EndpointMapping) {
    return `${this.dir}/${url}/${method}.js`;
  }
}
