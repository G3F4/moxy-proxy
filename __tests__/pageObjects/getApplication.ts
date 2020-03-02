import { Selector } from 'testcafe';
import getApplicationBar from './appBar';
import getEndpointsView from './getEndpointsView';
import getServerStateView from './getServerStateView';
import getViewTabs from './viewTabs';

export default function getApplication() {
  function getApplicationContainer() {
    return Selector('div').withAttribute('id', 'root');
  }
  async function waitForLoaded() {
    const applicationContainer = getApplicationContainer();
    await getApplicationBar(applicationContainer).waitForLoaded();
    const tabsViewActive = await getApplicationBar(
      applicationContainer,
    ).tabsViewActive();

    if (tabsViewActive) {
      await getViewTabs(applicationContainer).waitForLoaded();
    }
  }

  return {
    waitForLoaded,
    getApplicationBar() {
      return getApplicationBar(getApplicationContainer());
    },
    getViewTabs() {
      return getViewTabs(getApplicationContainer());
    },
    views: {
      getEndpointsView,
      getServerStateView: () => getServerStateView(getApplicationContainer()),
    },
  };
}
