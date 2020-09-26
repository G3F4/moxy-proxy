import '../common.steps';
import '../jsonViewer.steps';
import '../editor.steps';
import { Then } from "cucumber";
import { Selector } from "testcafe";
import userClick from '../../__tests__/utils/userClick';
import TestController from '../TestController';

Then(/^I open server state scenario menu and select "(Reset server|Copy to clipboard|Update with clipboard|Delete scenario)" option$/, async (t: TestController, [text]: [string]) => {
  const menu = await Selector('button')
    .withAttribute('aria-controls', 'server-state-menu');

  await t.expect(menu.exists).ok('Unable to find server state scenario menu')
  await userClick(menu);

  const option = await Selector('div')
    .withAttribute('id', 'server-state-menu')
    .find('ul')
    .find('li')
    .withExactText(text);

  await userClick(option);
});