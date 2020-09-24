import { Then, When } from 'cucumber';
import getApplication from '../../__tests__/pageObjects/getApplication';
import '../common.steps';
import TestController from '../TestController';

When(/^I enter into editor "(.+)"$/, async (t: TestController, [viewMode]: [string]) => {
  const application = await getApplication();

  await application.waitForLoaded();

  const serverStateView = application.views.getServerStateView();

  await serverStateView.waitForLoaded();

  const addServerStateScenarioView = await serverStateView.addServerStateScenario();
  const stateScenarioEditor = await addServerStateScenarioView.getEditor();
  await stateScenarioEditor.waitForLoaded();
  await stateScenarioEditor.enterCode(`"items": []`);
});

When(/^I clean editor$/, async (t: TestController) => {
  const application = await getApplication();

  await application.waitForLoaded();

  const serverStateView = application.views.getServerStateView();

  await serverStateView.waitForLoaded();

  const addServerStateScenarioView = await serverStateView.addServerStateScenario();
  const stateScenarioEditor = await addServerStateScenarioView.getEditor()
  await stateScenarioEditor.deleteCode();
});


