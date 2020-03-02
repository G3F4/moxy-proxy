import { Selector } from 'testcafe';
import userClick from '../utils/userClick';
import userWait from '../utils/userWait';

export default function getServerStateView(parent: Selector) {
  function getViewHeader() {
    return parent.find('h5').withText('Server state').parent();
  }
  function getViewContainer() {
    return getViewHeader().nextSibling();
  }
  function getFallback() {
    return parent.find('div').withText('Loading server state...');
  }
  async function waitForLoaded() {
    const viewContentVisible = await getViewHeader().exists;
    const viewLoading = await getFallback().exists;

    if (viewLoading || !viewContentVisible) {
      await userWait();
      await waitForLoaded();
    }
  }

  return {
    waitForLoaded,
    async searchValue(expectedValue: string) {
      const value = await getViewContainer()
        .find('div')
        .withText(expectedValue);

      const valueExists = await value.exists;

      if (!valueExists) {
        throw new Error('searched value does not exists');
      }
    },
    async addServerStateScenario() {
      const addServerStateScenarioButton = getViewContainer()
        .find('button')
        .withText('ADD SERVER SCENARIO');
      const addServerStateScenarioViewContainer = getViewContainer()
        .find('h6')
        .withText('Add server scenario')
        .parent('div')
        .withAttribute('role', 'dialog');

      await userClick(addServerStateScenarioButton);

      return {
        async enterScenarioName(scenarioName: string) {},
        async editScenarioState() {},
      };
    },
  };
}
