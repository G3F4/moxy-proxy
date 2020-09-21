import 'testcafe';
import { APP_URL } from '../server/config';
import getApplication from './pageObjects/getApplication';

fixture`User can change layout`.page(APP_URL);

test('change view mode', async () => {
  const { getApplicationBar } = await getApplication();

  await getApplicationBar().changeViewMode('Board view');
  await getApplicationBar().changeViewMode('Tabs view');
  await getApplicationBar().changeViewMode('Panels view');
  await getApplicationBar().changeViewMode('Board view');
  await getApplicationBar().changeViewMode('Tabs view');
});
