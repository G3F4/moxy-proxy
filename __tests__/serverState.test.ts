import 'testcafe';
import { APP_URL } from '../server/config';
import getApplication from './pageObjects/getApplication';

fixture`User can read, edit and add server state scenario`.page(APP_URL);

test('read server state', async () => {
  const application = await getApplication();
  await application.waitForLoaded();

  const serverStateView = application.views.getServerStateView();
  await serverStateView.waitForLoaded();
  await serverStateView.searchValue('"requestCount":int0');
});
