import { Selector, t } from 'testcafe';
import userClick from '../utils/userClick';
import userWait from '../utils/userWait';

export default function appBar(parent: Selector) {
  const appBarContainer = Selector('header');
  function getFallback() {
    return parent.find('div').withText('Loading tabs layout...');
  }
  function getViewModeSelect() {
    return appBarContainer
      .find('label')
      .withText('View mode')
      .parent();
  }

  function getStateScenarioSelect() {
    return appBarContainer
      .find('label')
      .withText('State scenario')
      .parent();
  }

  async function selectOption(select: Selector, optionLabel: string) {
    await userClick(select);

    const option = select.find('li').withText(optionLabel);

    await userClick(option);
  }
  async function waitForLoaded() {
    const loading = await getFallback().exists;

    if (loading) {
      console.log(['viewTabs.waitForLoaded']);
      userWait();
      await waitForLoaded();
    }
  }

  return {
    waitForLoaded,
    async changeStateScenario(scenarioName: string) {
      const select = getStateScenarioSelect();

      await selectOption(select, scenarioName);
    },
    async changeViewMode(viewMode: string) {
      const select = getViewModeSelect();

      await selectOption(select, viewMode);
    },
    async tabsViewActive() {
      await appBarContainer;
      const viewMode = await getViewModeSelect().find('input').value;

      return viewMode === 'tabs';
    },
  };
}
