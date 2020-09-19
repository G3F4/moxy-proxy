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
  static defaultScenarioId = 'default';
  private activeServerStateScenarioId = ServerStateService.defaultScenarioId;
  private serverStateScenarios: Record<string, ServerState> = {};
  private serverStateScenarioMappings: ServerStateScenarioMapping[];
  private serverStateInterface = '';
  private serverStateInterfaceFileName = 'interfaces.ts';
  private initialServerStatePath = `${DATA_DIR}/serverState/${this.activeServerStateScenarioId}.json`;
  private serverStateScenariosMapPath = `${DATA_DIR}/serverStateScenarios.json`;
  private initialServerStates: Record<string, ServerState> = {};

  getActiveServerStateScenarioId() {
    return this.activeServerStateScenarioId;
  }

  getServerState() {
    return this.serverStateScenarios[this.activeServerStateScenarioId];
  }

  getServerStateInterface() {
    return this.serverStateInterface;
  }

  getServerStateScenarioMappings() {
    return this.serverStateScenarioMappings;
  }

  constructor(readonly fileService: FileService) {
    this.serverStateScenarios[
      this.activeServerStateScenarioId
    ] = fileService.readJSON(this.initialServerStatePath);
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

  updateScenarioState({
    state,
    serverStateScenarioId,
  }: {
    state: ServerState;
    serverStateScenarioId: string;
  }) {
    logInfo(['updateServerState'], serverStateScenarioId);

    this.serverStateScenarios[serverStateScenarioId] = state;

    // this.saveServerStateToFile(serverStateScenarioId, state);
    // this.makeTypesFromInitialServerState().then(() => {
    //   return undefined;
    // });
  }

  addServerStateScenario(scenario: ServerStateScenario) {
    logInfo(['addServerStateScenario'], scenario);

    const mappings = [
      ...this.serverStateScenarioMappings,
      {
        name: scenario.name,
        id: scenario.id,
        path: this.createServerStateScenarioDataPath(scenario),
      },
    ];

    this.updateScenarioState({
      serverStateScenarioId: scenario.id,
      state: scenario.state,
    });
    this.updateMappings(mappings);
  }

  changeServerStateScenario(scenarioId: string) {
    logInfo(['changeServerStateScenario'], scenarioId);
    this.updateScenarioState({
      state: this.serverStateScenarios[scenarioId],
      serverStateScenarioId: scenarioId,
    });
    this.activeServerStateScenarioId = scenarioId;
  }

  deleteStateScenario(scenarioId: string) {
    const mapping = this.serverStateScenarioMappings.find(
      ({ id }) => id === scenarioId,
    );

    if (mapping) {
      const updatedScenarioMappings = this.serverStateScenarioMappings.filter(
        ({ id }) => id !== scenarioId,
      );

      this.updateMappings(updatedScenarioMappings);
      this.activeServerStateScenarioId = ServerStateService.defaultScenarioId;
      this.changeServerStateScenario(ServerStateService.defaultScenarioId);
      this.fileService.deleteFile(`/${mapping.path}`);
    }
  }

  resetServerState(serverStateScenarioId: string) {
    this.updateScenarioState({
      serverStateScenarioId,
      state: this.initialServerStates[serverStateScenarioId],
    });
  }

  persistChanges() {
    logInfo(['persistChanges']);

    this.persistMappings();
    this.persistScenarios();
  }

  private updateMappings(mappings: ServerStateScenarioMapping[]) {
    logInfo(['updateMappings'], mappings);

    this.serverStateScenarioMappings = mappings;
    // this.saveServerStateScenarioMappings(mappings);
  }

  private persistMappings() {
    this.saveServerStateScenarioMappings(this.serverStateScenarioMappings);
  }

  private persistScenarios() {
    Object.entries(this.serverStateScenarios).forEach(
      ([scenarioName, scenarioState]) => {
        this.saveServerStateToFile(scenarioName, scenarioState);
      },
    );
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

    this.fileService.saveJSON(
      `${DATA_DIR}/${serverStateScenarioDataPath}`,
      scenario.state,
    );
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
