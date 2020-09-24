import { Then, When } from 'cucumber';
import getApplication from '../../__tests__/pageObjects/getApplication';
import '../common.steps';

When(/^I select "(Panels|Tabs|Board) view" option$/, async (t: TestController, [viewMode]: [string]) => {
  const { getApplicationBar } = await getApplication();

  await getApplicationBar().changeViewMode(`${viewMode} view`)
});

Then(/^Layout changes to (Panels|Tabs|Board)$/, async (t: TestController, [viewMode]: [string]) => {
  const { getApplicationBar } = await getApplication();
  const activeViewMode = await getApplicationBar().getViewMode() as string;

  await t.expect(activeViewMode.toLowerCase()).eql(viewMode.toLowerCase());
});