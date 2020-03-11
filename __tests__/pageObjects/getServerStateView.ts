import { Selector } from 'testcafe';
import userClick from '../utils/userClick';
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

  async function searchValue(expectedValue: string) {
    const value = await getViewContainer()
      .find('div')
      .withText(expectedValue);
    const valueExists = await value.exists;

    if (!valueExists) {
      throw new Error(`searched value: ${expectedValue} does not exists`);
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
    async searchObjectField(props: {
      key: string;
      type: 'string' | 'int' | 'bool';
      value: string;
    }) {
      const { key, value, type } = props;
      const expectedValue = `"${key}":${type}${value}`;

      await searchValue(expectedValue);
    },
    async searchObject(props: { key: string; fieldsCount: number }) {
      const { key, fieldsCount } = props;
      const expectedValue = `"${key}":{${fieldsCount} item${
        fieldsCount > 1 ? 's' : ''
      }`;

      await searchValue(expectedValue);
    },
    async searchArray(props: { key: string; itemsCount: number }) {
      const { key, itemsCount } = props;
      const expectedValue = `"${key}":[${itemsCount} item${
        itemsCount > 1 ? 's' : ''
      }`;

      await searchValue(expectedValue);
    },
    async searchArrayItem(props: {
      index: number;
      type: 'string' | 'int' | 'bool';
      value: string;
    }) {
      const { index, value, type } = props;
      const expectedValue = `${index}:${type}${
        type === 'string' ? '"' : ''
      }${value}${type === 'string' ? '"' : ''}`;

      await searchValue(expectedValue);
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
