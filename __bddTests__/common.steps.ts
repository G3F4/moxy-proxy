import { Given, Then } from 'cucumber';
import { Selector } from 'testcafe';
import getApplication from '../__tests__/pageObjects/getApplication';
import userClick from '../__tests__/utils/userClick';
import userPressKey from '../__tests__/utils/userPressKey';
import userWait from '../__tests__/utils/userWait';
import userWrite from '../__tests__/utils/userWrite';
import { APP_URL } from '../server/config';
import TestController from './TestController';

Given('I open Moxy Proxy', async (t: any) => {
  await t.navigateTo(APP_URL);

  const { waitForLoaded } = await getApplication();

  await waitForLoaded();
});

Then(/^I wait for (.+) seconds$/, async (t: TestController, [seconds]: [string]) => {
  await userWait(parseInt(seconds,10));
});

Then(/^I click "(.+)" button$/, async (t: TestController, [buttonLabel]: [string]) => {
  const button = Selector('button').withExactText(buttonLabel);
  await userClick(button);
});

Then(/^I enter "(.+)" in input with label "(.+)"$/, async (t: TestController, [textToEnter, inputLabel]: [string, string]) => {
  const input = Selector('label').withExactText(inputLabel).parent().find('input');
  await userWrite(input, textToEnter);
});

Then(/^I press (tab|enter) on keyboard$/, async (t: TestController, [key]: [string]) => {
  await userPressKey({ key });
});