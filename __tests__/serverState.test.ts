import 'testcafe';
import { APP_URL } from '../server/config';
import getApplication from './pageObjects/getApplication';

fixture`User can read, edit and add server state scenario`.page(APP_URL);

test('read server state', async () => {
  const application = getApplication();

  await application.waitForLoaded();

  const serverStateView = application.views.getServerStateView();

  await serverStateView.waitForLoaded();
  await serverStateView.searchValue('"requestCount":int0');
});

test('add state scenario', async (t) => {
  const application = getApplication();

  await application.waitForLoaded();

  const serverStateView = application.views.getServerStateView();

  await serverStateView.waitForLoaded();

  const addServerStateScenarioView = await serverStateView.addServerStateScenario();

  await addServerStateScenarioView.enterScenarioName('test test test');
  await addServerStateScenarioView.editScenarioState();
  await addServerStateScenarioView.submitServerStateScenario();
  await application.getApplicationBar().changeStateScenario('test test test');
  await serverStateView.searchValue('"requestCount":int101');
});
