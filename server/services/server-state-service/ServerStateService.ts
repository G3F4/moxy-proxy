import {
  ServerState,
  ServerStateScenario,
  ServerStateScenarioMapping,
} from '../../../sharedTypes';
import { DATA_DIR } from '../../config';
import FileManager from '../../infrastructure/file-manager/FileManager';
import generateTypeFromJSON from '../../utils/generateTypeFromJSON';
import { logError, logInfo } from '../../utils/logger';

export default class ServerStateService {
  static defaultScenarioId = 'default';
  private activeServerStateScenarioId = ServerStateService.defaultScenarioId;
  private serverStateScenarios: Record<string, ServerState> = {};
  private serverStateScenarioMappings: ServerStateScenarioMapping[] = [];
  private serverStateInterface = '';
  private serverStateInterfaceFileName = 'interfaces.ts';
  private initialServerStatePath = `${DATA_DIR}/serverState/${this.activeServerStateScenarioId}.json`;
  private serverStateScenariosMapPath = `${DATA_DIR}/serverStateScenarios.json`;
  private readonly initialServerStates: Record<string, ServerState> = {};

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

  constructor(readonly fileManager: FileManager) {
    if (this.fileManager.checkIfExists(this.initialServerStatePath)) {
      this.serverStateScenarios[
        this.activeServerStateScenarioId
      ] = fileManager.readJSON(this.initialServerStatePath);
    } else {
      this.serverStateScenarios[
        this.activeServerStateScenarioId
      ] = {} as ServerState;
    }

    if (this.fileManager.checkIfExists(this.serverStateInterfaceFileName)) {
      this.serverStateInterface = fileManager.readText(
        this.serverStateInterfaceFileName,
      );
    } else {
      generateTypeFromJSON(
        'typescript',
        'ServerState',
        JSON.stringify(
          this.serverStateScenarios[this.activeServerStateScenarioId],
        ),
      )
        .then((response) => {
          this.serverStateInterface = response;
        })
        .catch(logError);
    }

    if (this.fileManager.checkIfExists(this.serverStateScenariosMapPath)) {
      this.serverStateScenarioMappings = fileManager.readJSON(
        this.serverStateScenariosMapPath,
      );
    } else {
      this.serverStateScenarioMappings = [
        {
          id: this.activeServerStateScenarioId,
          name: this.activeServerStateScenarioId,
          path: null,
        },
      ];
    }

    this.initialServerStates = this.serverStateScenarios;
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
    // this.generateTypesFromState().then(() => {
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
      this.fileManager.deleteFile(`/${mapping.path}`);
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
    return this.fileManager.readJSON<ServerState>(path);
  }

  private saveServerStateToFile(
    serverStateScenarioId: string,
    data: ServerState,
  ) {
    const serverStateScenarioMapping = this.serverStateScenarioMappings.find(
      scenario => scenario.id === serverStateScenarioId,
    );

    if (serverStateScenarioMapping) {
      this.fileManager.saveJSON(
        `${DATA_DIR}/${serverStateScenarioMapping.path}`,
        data,
      );
    }
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

  private createServerStateScenarioDataPath(scenario: ServerStateScenario) {
    return `serverState/${scenario.name}.json`;
  }

  private saveServerStateScenarioMappings(
    scenarios: ServerStateScenarioMapping[],
  ) {
    this.fileManager.saveJSON(this.serverStateScenariosMapPath, scenarios);
  }
}
