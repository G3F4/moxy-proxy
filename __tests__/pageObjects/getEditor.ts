import { Selector } from 'testcafe';
import userWait from '../utils/userWait';
import userClick from '../utils/userClick';
import userPressKey, { UserPressKeyOptions } from '../utils/userPressKey';

export default function getEditor(parent: Selector) {
  function getEditorInput() {
    return parent.find('textarea');
  }

  function getFallback() {
    return parent.withText('Loading...');
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
    async tab(options?: UserPressKeyOptions) {
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
        chars.map(async (char) => {
          const key = char === ' ' ? 'space' : char;

          await userPressKey({ key });
        }),
      );
    },
  };
}
