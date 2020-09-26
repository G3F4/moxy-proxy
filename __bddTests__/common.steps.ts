import { Given, Then } from 'cucumber';
import { Selector } from 'testcafe';
import getApplication from '../__tests__/pageObjects/getApplication';
import userClick from '../__tests__/utils/userClick';
import userPressKey from '../__tests__/utils/userPressKey';
import userTypes from '../__tests__/utils/userTypes';
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
  const button = await Selector('button').withExactText(buttonLabel);
  await userClick(button);
});

Then(/^I enter "(.+)" in input with label "(.+)"$/, async (t: TestController, [textToEnter, inputLabel]: [string, string]) => {
  const input = await Selector('label').withExactText(inputLabel).parent().find('input');
  await userWrite(input, textToEnter);
});

Then(/^I press (backspace|tab|enter|capslock|esc|space|pageup|pagedown|end|home|left|right|up|down|ins|delete) on keyboard$/, async (t: TestController, [key]: [string]) => {
  await userPressKey({ key });
});

Then(/^I type "(.+)" on keyboard$/, async (t: TestController, [text]: [string]) => {
  await userTypes(text);
});

Then(/^I see view header with label "(.+)"$/, async (t: TestController, [text]: [string]) => {
  const header = await Selector('h5').withExactText(text);

  await t.expect(header.exists).ok(`Unable to find view header | text: ${text}`)
});

Then(/^I click tab with label "(.+)"$/, async (t: TestController, [text]: [string]) => {
  const tabs = await Selector('div').withAttribute('role', 'tablist');
  const tabLabel = tabs.find('button').withExactText(text);

  try {
    await userClick(tabLabel);
  }
  catch (e) {
    throw new Error(`Unable to click tab with label: ${text}`);
  }
});

Then(/^I open select with label "(.+)" and select "(.+)" option$/, async (t: TestController, [selectLabel, optionLabel]: [string, string]) => {
  const selectLabelEl = await Selector('label').withExactText(selectLabel);
  const selectId = await selectLabelEl.id;
  try {
    await userClick(selectLabelEl);
  } catch (e) {
    throw new Error(`Unable to find select with label: "${selectLabel}"`)
  }
  const options = await Selector('ul').withAttribute('aria-labelledby', selectId);
  if (!(await options.exists)) {
    throw new Error(`Unable to find select option list labelled by id: "${selectId}"`)
  }
  try {
    const option = await options.find('li').withExactText(optionLabel);
    await userClick(option);
  } catch (e) {
    throw new Error(`Unable to find select option with label: "${optionLabel}"`);
  }
});
