import { Selector } from 'testcafe';
import userClick from '../utils/userClick';
import userPressKey, { UserPressKeyOptions } from '../utils/userPressKey';
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
          function getEditorInput() {
            return getEditorContainer().find('textarea');
          }
          function getFallback() {
            return getEditorContainer().withText('Loading...');
          }
          async function waitForLoaded() {
            const loading = await getFallback().exists;

            if (loading) {
              await userWait();
              await waitForLoaded();
            }
          }

          return {
            async focusEditor() {
              await userClick(getEditorInput());
            },
            waitForLoaded,
            async cursorUp(options?: UserPressKeyOptions) {
              await userPressKey({ key: 'up', ...(options || {}) });
            },
            async cursorDown(options?: UserPressKeyOptions) {
              await userPressKey({ key: 'down', ...(options || {}) });
            },
            async cursorLeft(options?: UserPressKeyOptions) {
              await userPressKey({ key: 'left', ...(options || {}) });
            },
            async cursorRight(options?: UserPressKeyOptions) {
              await userPressKey({ key: 'right', ...(options || {}) });
            },
            async cursorToEnd() {
              await userPressKey({ key: 'end' });
            },
            async cursorToHome() {
              await userPressKey({ key: 'home' });
            },
            async cursorToBottom() {
              await userPressKey({ key: 'pagedown' });
            },
            async cursorToTop() {
              await userPressKey({ key: 'pageup' });
            },
            async enter(options?: UserPressKeyOptions) {
              await userPressKey({ key: 'enter', ...(options || {}) });
            },
            async tab(
              options?: UserPressKeyOptions,
            ) {
              await userPressKey({ key: 'tab', ...(options || {}) });
            },
            async deleteCode(howManyCharacters = 1) {
              for (let i = 0; i < howManyCharacters; i++) {
                await userPressKey({
                  key: 'backspace',
                });
              }
            },
            async enterCode(code: string) {
              const chars = code.split('');

              await Promise.all(
                chars.map(async char => {
                  const key = char === ' ' ? 'space' : char;

                  await userPressKey({ key });
                }),
              );
            },
          };
        },
      };
    },
  };
}
