import { exec } from 'child_process';
import * as util from 'util';
import { ServerState } from '../../../interfaces';
import { ServerStateScenario, ServerStateScenarioMapping } from '../../../sharedTypes';
import { logError, logInfo } from '../../utils/logger';
import FileService from '../file-service/FileService';
import SocketsService from '../sockets-service/SocketsService';

const execPromised = util.promisify(exec);

export default class ServerStateService {
  private activeServerStateScenarioId = 'default';
  private serverState: ServerState;
  private serverStateInterface: string = '';
  private serverStateScenarioMappings: ServerStateScenarioMapping[];
  private serverStateInterfaceFileName = 'interfaces.ts';
  private initialServerStatePath = `data/serverState/${this.activeServerStateScenarioId}.json`;
  private serverStateScenariosMapPath = 'data/serverStateScenarios.json';
  private readonly initialServerStates: Record<string, ServerState> = {};

  getActiveServerStateScenarioId() {
    return this.activeServerStateScenarioId;
  }

  getServerState() {
    return this.serverState;
  }

  getServerStateInterface() {
    return this.serverStateInterface;
  }

  getServerStateScenarioMappings() {
    return this.serverStateScenarioMappings;
  }

  constructor(readonly fileService: FileService, readonly socketsService: SocketsService) {
    this.serverState = fileService.readJSON(this.initialServerStatePath);
    this.serverStateInterface = fileService.readText(this.serverStateInterfaceFileName);
    this.serverStateScenarioMappings = fileService.readJSON(this.serverStateScenariosMapPath);
    this.initialServerStates = {
      default: this.loadServerState(this.initialServerStatePath),
    };
  }

  updateServerState({
    state,
    serverStateScenarioId,
  }: {
    state: ServerState;
    serverStateScenarioId: string;
  }) {
    logInfo(['updateServerState'], serverStateScenarioId);

    this.serverState = {
      ...this.serverState,
      ...state,
    };

    this.saveServerStateToFile(serverStateScenarioId, this.serverState);
    this.socketsService.broadcastEvent({ action: 'updateServerState', payload: this.serverState });
    this.makeTypesFromInitialServerState().then(() => {});
  }

  addServerStateScenario(scenario: ServerStateScenario) {
    this.saveServerStateScenario(scenario);

    this.serverStateScenarioMappings = [
      ...this.serverStateScenarioMappings,
      {
        name: scenario.name,
        id: Date.now().toString(),
        path: this.getServerStateScenarioDataPath(scenario),
      },
    ];

    this.saveServerStateScenarioMappings(this.serverStateScenarioMappings);
  }

  changeServerStateScenario(scenarioId: string) {
    const mapping = this.serverStateScenarioMappings.find(({ id }) => id === scenarioId);

    if (mapping) {
      this.activeServerStateScenarioId = scenarioId;

      const state = this.fileService.readJSON<ServerState>(mapping.path);

      if (!this.initialServerStates[mapping.id]) {
        this.initialServerStates[mapping.id] = state;
      }

      this.updateServerState({
        state,
        serverStateScenarioId: mapping.id,
      });
    }
  }

  resetServerState(serverStateScenarioId: string) {
    this.updateServerState({
      serverStateScenarioId,
      state: this.initialServerStates[serverStateScenarioId],
    });
  }

  private loadServerState(path: string) {
    return this.fileService.readJSON<ServerState>(path);
  }

  private saveServerStateToFile(serverStateScenarioId: string, data: ServerState) {
    const serverStateScenarioMapping = this.serverStateScenarioMappings.find(
      scenario => scenario.id === serverStateScenarioId,
    );

    if (serverStateScenarioMapping) {
      this.fileService.saveJSON(serverStateScenarioMapping.path, data);
    }
  }

  async makeTypesFromInitialServerState() {
    const { stderr } = await execPromised(
      `make_types -i ${this.serverStateInterfaceFileName} ${this.initialServerStatePath} ServerState`,
    );

    if (stderr) {
      logError(stderr);
    } else {
      this.serverStateInterface = this.fileService.readText(this.serverStateInterfaceFileName);
      this.socketsService.broadcastEvent({ action: 'updateServerStateInterface', payload: this.serverStateInterface });
    }
  }

  private saveServerStateScenario(scenario: ServerStateScenario) {
    const serverStateScenarioDataPath = this.getServerStateScenarioDataPath(scenario);

    this.fileService.saveJSON(serverStateScenarioDataPath, scenario.state);
  }

  private getServerStateScenarioDataPath(scenario: ServerStateScenario) {
    return `data/serverState/${scenario.name}.json`;
  }

  private saveServerStateScenarioMappings(scenarios: ServerStateScenarioMapping[]) {
    this.fileService.saveJSON(this.serverStateScenariosMapPath, scenarios);
  }
}
