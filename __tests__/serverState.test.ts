import 'testcafe';
import { APP_URL } from '../server/config';
import getApplication from './pageObjects/getApplication';

const scenarioName = 'test test test';

fixture`User can read, edit and add server state scenario`.page(APP_URL);

test('read default state scenario mockedData', async () => {
  const application = await getApplication();

  await application.waitForLoaded();

  const serverStateView = application.views.getServerStateView();

  await serverStateView.waitForLoaded();
  await serverStateView.searchObjectField({
    key: 'requestCount',
    type: 'int',
    value: '0',
  });
  await serverStateView.searchObject({ key: 'data', fieldsCount: 1 });
  await serverStateView.searchArray({ key: 'test', itemsCount: 2 });
  await serverStateView.searchArrayItem({
    index: 0,
    type: 'string',
    value: 'test',
  });
  await serverStateView.searchArrayItem({
    index: 1,
    type: 'string',
    value: 'test2',
  });
  await serverStateView.searchObjectField({
    key: 'modified',
    type: 'bool',
    value: 'false',
  });
});

test('add state scenario from scratch', async () => {
  const application = await getApplication();

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
  await serverStateView.searchObject({ key: 'test', fieldsCount: 2 });
  await serverStateView.searchObjectField({
    key: 'flag',
    type: 'bool',
    value: 'true',
  });
  await serverStateView.searchArray({ key: 'items', itemsCount: 3 });
  await serverStateView.searchArrayItem({
    index: 0,
    type: 'int',
    value: '1',
  });
  await serverStateView.searchArrayItem({
    index: 1,
    type: 'int',
    value: '2',
  });
  await serverStateView.searchArrayItem({
    index: 2,
    type: 'int',
    value: '3',
  });
});

test('delete state scenario', async () => {
  const application = await getApplication();

  await application.waitForLoaded();
  await application.getApplicationBar().changeStateScenario(scenarioName);

  const serverStateView = application.views.getServerStateView();

  await serverStateView.waitForLoaded();

  const moreMenu = await serverStateView.openMoreMenu();

  await moreMenu.deleteScenario();
});
