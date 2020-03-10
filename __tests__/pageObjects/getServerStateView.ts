import { Selector } from 'testcafe';
import userClick from '../utils/userClick';
import userPressKey, { UserPressKeyOptions } from '../utils/userPressKey';
import userWait from '../utils/userWait';
import userWrite from '../utils/userWrite';
import getEditor from './getEditor';

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
    async openMoreMenu() {
      function getButton() {
        return getViewHeader()
          .find('button')
          .withAttribute('aria-label', 'more');
      }

      function getMoreMenuContainer() {
        return Selector('div')
          .withAttribute('id', 'server-state-menu')
          .find('ul');
      }

      await userClick(getButton());

      return {
        async deleteScenario() {
          await userClick(
            getMoreMenuContainer()
              .find('li')
              .withText('Delete scenario'),
          );
        },
      };
    },
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
      function getAddServerStateScenarioViewContainer() {
        return Selector('h6')
          .withText('Add server scenario')
          .parent('div')
          .withAttribute('role', 'dialog');
      }

      function getAddServerStateScenarioButton() {
        return getViewHeader()
          .find('button')
          .withText('ADD SERVER SCENARIO');
      }

      function getSubmitServerStateScenarioSubmit() {
        return getAddServerStateScenarioViewContainer()
          .find('button')
          .withText('SUBMIT');
      }

      await userClick(getAddServerStateScenarioButton());

      return {
        async enterScenarioName(scenarioName: string) {
          const input = getAddServerStateScenarioViewContainer().find('input');

          await userWrite(input, scenarioName);
        },
        async submitServerStateScenario() {
          await userClick(getSubmitServerStateScenarioSubmit());
        },
        async getEditor() {
          function getEditorContainer() {
            return getAddServerStateScenarioViewContainer()
              .find('p')
              .withText('Modify copy of state before adding')
              .parent('div')
              .find('section');
          }

          return getEditor(getEditorContainer());
        },
      };
    },
  };
}
