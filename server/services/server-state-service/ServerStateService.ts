import { exec } from 'child_process';
import * as util from 'util';
import { ServerState } from '../../../interfaces';
import {
  ServerStateScenario,
  ServerStateScenarioMapping,
} from '../../../sharedTypes';
import { DATA_DIR } from '../../config';
import { logError, logInfo } from '../../utils/logger';
import FileService from '../file-service/FileService';

const execPromised = util.promisify(exec);

export default class ServerStateService {
  private activeServerStateScenarioId = 'default';
  private serverState: ServerState;
  private serverStateInterface: string = '';
  private serverStateScenarioMappings: ServerStateScenarioMapping[];
  private serverStateInterfaceFileName = 'interfaces.ts';
  private initialServerStatePath = `${DATA_DIR}/serverState/${this.activeServerStateScenarioId}.json`;
  private serverStateScenariosMapPath = `${DATA_DIR}/serverStateScenarios.json`;
  private initialServerStates: Record<string, ServerState> = {};

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

  constructor(readonly fileService: FileService) {
    this.serverState = fileService.readJSON(this.initialServerStatePath);
    this.serverStateInterface = fileService.readText(
      this.serverStateInterfaceFileName,
    );
    this.serverStateScenarioMappings = fileService.readJSON(
      this.serverStateScenariosMapPath,
    );
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

    this.serverState = state;

    this.saveServerStateToFile(serverStateScenarioId, state);
    this.makeTypesFromInitialServerState().then(() => {});
  }

  private updateMappings(mappings: ServerStateScenarioMapping[]) {
    logInfo(['updateMappings'], mappings);

    this.serverStateScenarioMappings = mappings;
    this.saveServerStateScenarioMappings(mappings);
  }

  addServerStateScenario(scenario: ServerStateScenario) {
    this.saveServerStateScenario(scenario);

    const mappings = [
      ...this.serverStateScenarioMappings,
      {
        name: scenario.name,
        id: Date.now().toString(),
        path: this.createServerStateScenarioDataPath(scenario),
      },
    ];

    this.updateMappings(mappings);
  }

  changeServerStateScenario(scenarioId: string) {
    const mapping = this.serverStateScenarioMappings.find(
      ({ id }) => id === scenarioId,
    );

    if (mapping) {
      this.activeServerStateScenarioId = scenarioId;

      console.log(['`${DATA_DIR}/${mapping.path}`'], `${DATA_DIR}/${mapping.path}`)

      const state = this.fileService.readJSON<ServerState>(
        `${DATA_DIR}/${mapping.path}`,
      );

      if (!this.initialServerStates[mapping.id]) {
        this.initialServerStates[mapping.id] = state;
      }

      this.updateServerState({
        state,
        serverStateScenarioId: mapping.id,
      });
    }
  }

  deleteStateScenario(scenarioId: string) {
    const mapping = this.serverStateScenarioMappings.find(
      ({ id }) => id === scenarioId,
    );

    if (mapping) {
      const scenarioMappings = this.serverStateScenarioMappings.filter(
        ({ id }) => id !== scenarioId,
      );

      this.updateMappings(scenarioMappings);
      this.activeServerStateScenarioId = scenarioId;
      this.changeServerStateScenario(this.getDefaultScenarioId());
      this.fileService.deleteFile(`/${mapping.path}`);
    }
  }

  resetServerState(serverStateScenarioId: string) {
    this.updateServerState({
      serverStateScenarioId,
      state: this.initialServerStates[serverStateScenarioId],
    });
  }

  private getDefaultScenarioId() {
    return 'default';
  }

  private loadServerState(path: string) {
    return this.fileService.readJSON<ServerState>(path);
  }

  private saveServerStateToFile(
    serverStateScenarioId: string,
    data: ServerState,
  ) {
    const serverStateScenarioMapping = this.serverStateScenarioMappings.find(
      scenario => scenario.id === serverStateScenarioId,
    );

    if (serverStateScenarioMapping) {
      this.fileService.saveJSON(
        `${DATA_DIR}/${serverStateScenarioMapping.path}`,
        data,
      );
    }
  }

  async makeTypesFromInitialServerState() {
    const { stderr } = await execPromised(
      `make_types -i ${this.serverStateInterfaceFileName} ${this.initialServerStatePath} ServerState`,
    );

    if (stderr) {
      logError(stderr);
    } else {
      this.serverStateInterface = this.fileService.readText(
        this.serverStateInterfaceFileName,
      );
    }
  }

  private saveServerStateScenario(scenario: ServerStateScenario) {
    const serverStateScenarioDataPath = this.createServerStateScenarioDataPath(
      scenario,
    );

    this.fileService.saveJSON(`${DATA_DIR}/${serverStateScenarioDataPath}`, scenario.state);
  }

  private createServerStateScenarioDataPath(scenario: ServerStateScenario) {
    return `serverState/${scenario.name}.json`;
  }

  private saveServerStateScenarioMappings(
    scenarios: ServerStateScenarioMapping[],
  ) {
    this.fileService.saveJSON(this.serverStateScenariosMapPath, scenarios);
  }
}
