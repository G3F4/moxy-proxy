import '../common.steps';
import '../jsonViewer.steps';
import '../editor.steps';
import { When } from 'cucumber';
import { Selector } from 'testcafe';
import TestController from '../TestController';

When(
  /^I can see on endpoint with "(.*)" label$/,
  async (t: TestController, [endpointLabel]: string[]) => {
    const endpoint = await Selector('p').withExactText(endpointLabel);

    await t
      .expect(endpoint.exists)
      .ok(`Cannot find endpoint with label "${endpointLabel}"`);
  },
);
