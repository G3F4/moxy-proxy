import { Selector } from 'testcafe';
import userClick from '../utils/userClick';
import userWait from '../utils/userWait';

export default function viewTabs(parent: Selector) {
  function getFallback() {
    return parent.find('div').withText('Loading tabs layout...');
  }

  function getContainer() {
    return parent.find('div').withAttribute('role', 'tablist');
  }

  async function waitForLoaded() {
    const loading = await getFallback().exists;

    if (loading) {
      userWait();
      await waitForLoaded();
    }
  }

  return {
    waitForLoaded,
    async clickTab(label: string) {
      const selector = getContainer()
        .find('button')
        .withAttribute('role', 'tab')
        .withText(label);

      await userClick(selector);
    },
  };
}
