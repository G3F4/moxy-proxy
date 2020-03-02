import { Selector } from 'testcafe';
import userClick from '../utils/userClick';
import userPressKey from '../utils/userPressKey';
import userWait from '../utils/userWait';
import userWrite from '../utils/userWrite';

export default function getServerStateView(parent: Selector) {
  function getViewHeader() {
    return parent
      .find('h5')
      .withText('Server state')
      .parent();
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
      function getAddServerStateScenarioButton() {
        return getViewHeader()
          .find('button')
          .withText('ADD SERVER SCENARIO');
      }

      function getAddServerStateScenarioViewContainer() {
        return Selector('h6')
          .withText('Add server scenario')
          .parent('div')
          .withAttribute('role', 'dialog');
      }

      await userClick(getAddServerStateScenarioButton());

      return {
        async enterScenarioName(scenarioName: string) {
          const input = getAddServerStateScenarioViewContainer().find('input');

          await userWrite(input, scenarioName);
        },
        async editScenarioState() {
          await userPressKey('tab');
        },
      };
    },
  };
}
