import { Given } from 'cucumber';
import getApplication from '../__tests__/pageObjects/getApplication';
import { APP_URL } from '../server/config';

Given('I open Moxy Proxy', async (t: any) => {
  await t.navigateTo(APP_URL);

  const { waitForLoaded } = await getApplication();

  await waitForLoaded();
});
