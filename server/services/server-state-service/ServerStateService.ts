import {
  ServerState,
  ServerStateScenario,
  ServerStateScenarioMapping,
} from '../../../sharedTypes';
import { DATA_DIR } from '../../config';
import FileManager from '../../infrastructure/file-manager/FileManager';
import generateTypeFromJSON from '../../utils/generateTypeFromJSON';
import { logInfo } from '../../utils/logger';

export default class ServerStateService {
  static defaultScenarioId = 'default';

  private activeScenarioId = ServerStateService.defaultScenarioId;
  private scenarios: Record<string, ServerState> = {};
  private scenarioMappings: ServerStateScenarioMapping[] = [];
  private serverStateInterface = '';
  private serverStateScenariosMapPath = `${DATA_DIR}/serverStateScenarios.json`;
  private initialServerStates: Record<string, ServerState> = {};

  getActiveServerStateScenarioId() {
    return this.activeScenarioId;
  }

  getServerState() {
    return this.scenarios[this.activeScenarioId];
  }

  async getActiveScenarioInterface() {
    return await generateTypeFromJSON(
      'typescript',
      'ServerState',
      JSON.stringify(this.scenarios[this.activeScenarioId]),
    );
  }

  getServerStateScenarioMappings() {
    return this.scenarioMappings;
  }

  constructor(readonly fileManager: FileManager) {}

  async load() {
    const initialServerStatePath = `${DATA_DIR}/serverState/${this.activeScenarioId}.json`;

    if (this.fileManager.checkIfExists(initialServerStatePath)) {
      this.updateActiveScenario(
        this.fileManager.readJSON(initialServerStatePath),
      );
    } else {
      this.updateActiveScenario({} as ServerState);
    }

    if (this.fileManager.checkIfExists(this.serverStateScenariosMapPath)) {
      this.updateMappings(
        this.fileManager.readJSON(this.serverStateScenariosMapPath),
      );
    } else {
      this.updateMappings([
        {
          id: this.activeScenarioId,
          name: this.activeScenarioId,
          path: null,
        },
      ]);
    }

    this.initialServerStates = this.scenarios;
  }

  async updateScenarioState({
    state,
    serverStateScenarioId,
  }: {
    state: ServerState;
    serverStateScenarioId: string;
  }) {
    logInfo(['updateServerState'], serverStateScenarioId);

    this.scenarios[serverStateScenarioId] = state;
    this.serverStateInterface = await generateTypeFromJSON(
      'typescript',
      'ServerState',
      JSON.stringify(this.scenarios[this.activeScenarioId]),
    );
  }

  updateActiveScenario(state: ServerState) {
    logInfo(['updateActiveScenario'], state);

    this.scenarios[this.activeScenarioId] = state;
  }

  async addServerStateScenario(scenario: ServerStateScenario) {
    logInfo(['addServerStateScenario'], scenario);

    const mappings = [
      ...this.scenarioMappings,
      {
        name: scenario.name,
        id: scenario.id,
        path: this.createServerStateScenarioDataPath(scenario),
      },
    ];

    await this.updateScenarioState({
      serverStateScenarioId: scenario.id,
      state: scenario.state,
    });
    this.updateMappings(mappings);
  }

  async changeServerStateScenario(scenarioId: string) {
    logInfo(['changeServerStateScenario'], scenarioId);
    await this.updateScenarioState({
      state: this.scenarios[scenarioId],
      serverStateScenarioId: scenarioId,
    });
    this.activeScenarioId = scenarioId;
  }

  async deleteStateScenario(scenarioId: string) {
    const mapping = this.scenarioMappings.find(({ id }) => id === scenarioId);

    if (mapping) {
      const updatedScenarioMappings = this.scenarioMappings.filter(
        ({ id }) => id !== scenarioId,
      );

      this.updateMappings(updatedScenarioMappings);
      this.activeScenarioId = ServerStateService.defaultScenarioId;
      await this.changeServerStateScenario(
        ServerStateService.defaultScenarioId,
      );
      this.fileManager.deleteFile(`/${mapping.path}`);
    }
  }

  async resetServerState(serverStateScenarioId: string) {
    await this.updateScenarioState({
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

    this.scenarioMappings = mappings;
  }

  private persistMappings() {
    this.saveServerStateScenarioMappings(this.scenarioMappings);
  }

  private persistScenarios() {
    Object.entries(this.scenarios).forEach(([scenarioName, scenarioState]) => {
      this.saveServerStateToFile(scenarioName, scenarioState);
    });
  }

  private saveServerStateToFile(
    serverStateScenarioId: string,
    data: ServerState,
  ) {
    const serverStateScenarioMapping = this.scenarioMappings.find(
      scenario => scenario.id === serverStateScenarioId,
    );

    if (serverStateScenarioMapping) {
      this.fileManager.saveJSON(
        `${DATA_DIR}/${serverStateScenarioMapping.path}`,
        data,
      );
    }
  }

  private createServerStateScenarioDataPath(scenario: ServerStateScenario) {
    return `serverState/${scenario.name}.json`;
  }

  private saveServerStateScenarioMappings(
    scenarios: ServerStateScenarioMapping[],
  ) {
    this.fileManager.saveJSON(this.serverStateScenariosMapPath, scenarios);
  }

  private loadServerState(path: string) {
    return this.fileManager.readJSON<ServerState>(path);
  }

  private saveServerStateScenario(scenario: ServerStateScenario) {
    const serverStateScenarioDataPath = this.createServerStateScenarioDataPath(
      scenario,
    );

    this.fileManager.saveJSON(
      `${DATA_DIR}/${serverStateScenarioDataPath}`,
      scenario.state,
    );
  }
}
