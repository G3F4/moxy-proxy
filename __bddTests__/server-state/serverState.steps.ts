import { When } from 'cucumber';
import getApplication from '../../__tests__/pageObjects/getApplication';
import '../common.steps';
import TestController from '../TestController';

When(/^I clean editor$/, async (t: TestController) => {
  const application = await getApplication();

  await application.waitForLoaded();

  const serverStateView = application.views.getServerStateView();

  await serverStateView.waitForLoaded();

  const addServerStateScenarioView = await serverStateView.addServerStateScenario();
  const stateScenarioEditor = await addServerStateScenarioView.getEditor()
  await stateScenarioEditor.deleteCode();
});

When(/^I enter into editor "(.+)"$/, async (t: TestController, [line]: [string]) => {
  const application = await getApplication();
  const addServerStateScenarioView = await application.views.getServerStateView().addServerStateScenario();
  const stateScenarioEditor = await addServerStateScenarioView.getEditor();

  await stateScenarioEditor.waitForLoaded();
  await stateScenarioEditor.enterCode(line);
});


