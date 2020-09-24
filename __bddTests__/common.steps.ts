import { Given, Then } from 'cucumber';
import { Selector } from 'testcafe';
import getApplication from '../__tests__/pageObjects/getApplication';
import userClick from '../__tests__/utils/userClick';
import userWrite from '../__tests__/utils/userWrite';
import { APP_URL } from '../server/config';
import TestController from './TestController';

Given('I open Moxy Proxy', async (t: any) => {
  await t.navigateTo(APP_URL);

  const { waitForLoaded } = await getApplication();

  await waitForLoaded();
});

Then(/^I click "(.+)" button$/, async (t: TestController, [buttonLabel]: [string]) => {
  const button = Selector('button').withExactText(buttonLabel);
  await userClick(button);
});

Then(/^I enter "(.+)" in input with label "(.+)"$/, async (t: TestController, [textToEnter, inputLabel]: [string, string]) => {
  const input = Selector('label').withExactText(inputLabel).parent().find('input');
  await userWrite(input, textToEnter);
});