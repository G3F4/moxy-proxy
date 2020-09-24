import { Then, When } from 'cucumber';
import getApplication from '../../__tests__/pageObjects/getApplication';
import '../common.steps';

When(/^ssI select "(Panels|Tabs|Board) view" option$/, async (t: TestController, [viewMode]: [string]) => {
  const { getApplicationBar } = await getApplication();

  await getApplicationBar().changeViewMode(`${viewMode} view`)
});


