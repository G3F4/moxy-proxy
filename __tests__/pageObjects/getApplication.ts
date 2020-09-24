import { exec } from 'child_process';
import { Selector } from 'testcafe';
import * as util from 'util';
import getApplicationBar from './appBar';
import getEndpointsView from './getEndpointsView';
import getServerStateView from './getServerStateView';
import getViewTabs from './viewTabs';

const execPromised = util.promisify(exec);

async function prepareServerState(presetName: string) {
  const cleanData = 'rm -rf __testsData__/data';
  const createDataFolder = 'mkdirp __testsData__/data';
  const loadDataFromPreset = `cp -a __testsData__/${presetName}/* __testsData__/data`;
  const command = `${cleanData};${createDataFolder};${loadDataFromPreset}`;

  await execPromised(command);
}

export default async function getApplication() {
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

  await prepareServerState('initial');

  return {
    waitForLoaded,
    getApplicationBar() {
      return getApplicationBar(getApplicationContainer());
    },
    getViewTabs() {
      return getViewTabs(getApplicationContainer());
    },
    getActiveLayout() {},
    views: {
      getEndpointsView,
      getServerStateView: () => getServerStateView(getApplicationContainer()),
    },
  };
}
