import 'testcafe';
import { APP_URL } from '../server/config';
import getApplication from './pageObjects/getApplication';

const scenarioName = 'test test test';

fixture`User can read, edit and add server state scenario`.page(APP_URL);

test('read server state', async () => {
  const application = getApplication();

  await application.waitForLoaded();

  const serverStateView = application.views.getServerStateView();

  await serverStateView.waitForLoaded();
  await serverStateView.searchValue('"requestCount":int0');
});

test('add state scenario from scratch', async t => {
  const application = getApplication();

  await application.waitForLoaded();

  const serverStateView = application.views.getServerStateView();

  await serverStateView.waitForLoaded();

  const addServerStateScenarioView = await serverStateView.addServerStateScenario();

  await addServerStateScenarioView.enterScenarioName(scenarioName);
  const stateScenarioEditor = await addServerStateScenarioView.getEditor();
  await stateScenarioEditor.waitForLoaded();
  await stateScenarioEditor.focusEditor();
  await stateScenarioEditor.cursorToBottom();
  await stateScenarioEditor.cursorLeft();
  await stateScenarioEditor.cursorUp({ holdingShift: true, times: 8 });
  await stateScenarioEditor.deleteCode();
  await stateScenarioEditor.cursorLeft();
  await stateScenarioEditor.enter({ times: 2 });
  await stateScenarioEditor.cursorUp();
  await stateScenarioEditor.tab();
  await stateScenarioEditor.enterCode(`"test": {}`);
  await stateScenarioEditor.cursorLeft();
  await stateScenarioEditor.enter({ times: 2 });
  await stateScenarioEditor.cursorUp();
  await stateScenarioEditor.tab();
  await stateScenarioEditor.enterCode(`"items": []`);
  await stateScenarioEditor.cursorLeft();
  await stateScenarioEditor.enter({ times: 2 });
  await stateScenarioEditor.cursorUp();
  await stateScenarioEditor.tab();
  await stateScenarioEditor.enterCode(`1,`);
  await stateScenarioEditor.enter();
  await stateScenarioEditor.enterCode(`2,`);
  await stateScenarioEditor.enter();
  await stateScenarioEditor.enterCode(`3`);
  await stateScenarioEditor.cursorDown();
  await stateScenarioEditor.enterCode(`,`);
  await stateScenarioEditor.enter();
  await stateScenarioEditor.enterCode(`"flag": true`);
  await stateScenarioEditor.cursorUp({ times: 5, holdingAlt: true });
  await stateScenarioEditor.enterCode(`,`);
  await stateScenarioEditor.cursorDown({ times: 5 });
  await stateScenarioEditor.deleteCode();
  await addServerStateScenarioView.submitServerStateScenario();
  await application.getApplicationBar().changeStateScenario(scenarioName);
  await serverStateView.searchValue('"test":{2 items');
  await serverStateView.searchValue('"flag":booltrue');
  await serverStateView.searchValue('"items":[3 items');
  await serverStateView.searchValue('0:int1');
  await serverStateView.searchValue('1:int2');
  await serverStateView.searchValue('2:int3');
});

// TODO missing feature
test('delete state scenario', async (t) => {
  const application = getApplication();

  await application.waitForLoaded();
  await application.getApplicationBar().changeStateScenario(scenarioName);

  const serverStateView = application.views.getServerStateView();

  await serverStateView.waitForLoaded();
  const moreMenu = await serverStateView.openMoreMenu();
  await moreMenu.deleteScenario();
});
