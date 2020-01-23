import { ServerState } from '../../../interfaces';
import { Endpoint, EndpointMapping, Method } from '../../../sharedTypes';
import createFolderIfNotExists from '../../utils/createFolderIfNotExists';
import { logInfo } from '../../utils/logger';
import { nocache } from '../../utils/nocache';
import FileService from '../file-service/FileService';

export type RequestResponse = (state: ServerState, request: unknown) => unknown;
export type ServerUpdate = (request: unknown) => (state: ServerState) => void;

export interface Handler {
  requestResponse: RequestResponse;
  serverUpdate: ServerUpdate;
}

export default class EndpointsService {
  private endpoints: Endpoint[] = [];
  private endpointMappings: EndpointMapping[] = [];
  private dir: string = 'endpoints';
  private endpointMappingsFileName: string = 'endpoints.json';

  constructor(readonly fileService: FileService) {
    this.loadEndpoints();
  }

  public getEndpoints() {
    return this.endpoints;
  }

  public deleteEndpoint(endpointId: string) {
    this.endpoints = this.endpoints.filter(({ id }) => id !== endpointId);
    this.endpointMappings = this.endpointMappings.filter(({ id }) => id !== endpointId);

    this.saveEndpointMappings();
    logInfo(['deleteEndpoint'], endpointId);
  }

  public updateEndpoint(endpoint: Endpoint) {
    const endpointIndex = this.endpoints.findIndex(
      ({ url, method }) => endpoint.url === url && endpoint.method === method,
    );

    this.endpoints[endpointIndex] = endpoint;

    logInfo(['updateEndpoint'], endpoint);

    this.saveEndpointToFile(endpoint);
  }

  public getHandler({ method, url }: { method: Method; url: string }) {
    const endpoint = this.endpoints.find(
      endpoint => `/${endpoint.url}` === url && endpoint.method === method,
    );

    if (endpoint) {
      return this.loadHandler(endpoint);
    }
  }

  private getEndpointMappingsPath() {
    return `${this.dir}/${this.endpointMappingsFileName}`;
  }

  private loadEndpoints() {
    this.endpointMappings = this.fileService.readJSON<EndpointMapping[]>(
      this.getEndpointMappingsPath(),
    );
    //@ts-ignore
    this.endpoints = this.endpointMappings.reduce<EndpointMapping[]>((acc, endpointMapping) => {
      const { id, method, url } = endpointMapping;
      const handler = this.loadHandler(endpointMapping);

      if (handler) {
        return [
          ...acc,
          {
            id,
            method,
            url,
            responseCode: handler.requestResponse.toString(),
            serverStateUpdateCode: handler.serverUpdate.toString(),
          },
        ];
      } else {
        this.deleteEndpoint(id);
      }
    }, []);
  }

  public addEndpoint(endpoint: Endpoint) {
    logInfo(['addEndpoint'], endpoint);

    const endpointMapping: EndpointMapping = {
      id: Date.now().toString(),
      method: endpoint.method,
      url: endpoint.url,
    };

    this.endpoints = [...this.endpoints, endpoint];
    this.endpointMappings = [...this.endpointMappings, endpointMapping];

    this.saveEndpointMappings();
    this.saveEndpointToFile(endpoint);
  }

  private saveEndpointMappings() {
    this.fileService.saveJSON(this.getEndpointMappingsPath(), this.endpointMappings);
  }

  private saveEndpointToFile(endpoint: Endpoint) {
    const code = this.handlerTemplate(endpoint);
    const folders = endpoint.url.split('/');

    folders.forEach((item, index, arr) => {
      const path = `${this.dir}/${arr.slice(0, index + 1).join('/')}`;

      createFolderIfNotExists(path);
    });

    const path = this.handlerPath(endpoint);
    const fileExists = this.fileService.checkIfExist(path);

    if (fileExists) {
      this.fileService.saveText(path, code);
    } else {
      this.fileService.saveText(path, code, { openToAppend: true });
    }
  }

  private handlerTemplate(endpoint: Endpoint) {
    return (
      `
export ${endpoint.responseCode.trim()}

export ${endpoint.serverStateUpdateCode.trim()}
`.trim() + '\n'
    );
  }

  public loadHandler(endpoint: Endpoint | EndpointMapping): Handler | null {
    const path = this.handlerPath(endpoint);
    const handlerExists = this.fileService.checkIfExist(path);

    if (!handlerExists) {
      return null;
    }

    nocache(path);

    return require(`${this.fileService.cwd}/${path}`);
  }

  private handlerPath({ url, method }: Endpoint | EndpointMapping) {
    return `${this.dir}/${url}/${method}.js`;
  }
}
