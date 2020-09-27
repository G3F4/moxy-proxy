import { When } from 'cucumber';
import { Selector } from 'testcafe';
import getApplication from '../__tests__/pageObjects/getApplication';
import userClick from '../__tests__/utils/userClick';
import userPressKey from '../__tests__/utils/userPressKey';
import userTypes from '../__tests__/utils/userTypes';
import userWait from '../__tests__/utils/userWait';
import userWrite from '../__tests__/utils/userWrite';
import './feature.steps';
import TestController from './TestController';

When('I open Moxy Proxy', async (t: any) => {
  await t.navigateTo(t.fixtureCtx.host);

  const { waitForLoaded } = await getApplication();

  await waitForLoaded();
});

When(/^I wait for (.+) seconds$/, async (t: TestController, [seconds]: [string]) => {
  await userWait(parseInt(seconds,10));
});

When(/^I click "(.+)" button$/, async (t: TestController, [buttonLabel]: [string]) => {
  const button = await Selector('button').withExactText(buttonLabel);
  await userClick(button);
});

When(/^I enter "(.+)" in input with label "(.+)"$/, async (t: TestController, [textToEnter, inputLabel]: [string, string]) => {
  const input = await Selector('label').withExactText(inputLabel).parent().find('input');
  await userWrite(input, textToEnter);
});

When(/^I press (backspace|tab|enter|capslock|esc|space|pageup|pagedown|end|home|left|right|up|down|ins|delete) on keyboard$/, async (t: TestController, [key]: [string]) => {
  await userPressKey({ key });
});

When(/^I type "(.+)" on keyboard$/, async (t: TestController, [text]: [string]) => {
  await userTypes(text);
});

When(/^I see view header with label "(.+)"$/, async (t: TestController, [text]: [string]) => {
  const header = await Selector('h5').withExactText(text);

  await t.expect(header.exists).ok(`Unable to find view header | text: ${text}`)
});

When(/^I click tab with label "(.+)"$/, async (t: TestController, [text]: [string]) => {
  const tabs = await Selector('div').withAttribute('role', 'tablist');
  const tabLabel = tabs.find('button').withExactText(text);

  try {
    await userClick(tabLabel);
  }
  catch (e) {
    throw new Error(`Unable to click tab with label: ${text}`);
  }
});

async function openSelect(selectLabel: string) {
  const selectLabelEl = Selector('label').withExactText(selectLabel);
  const selectId = await selectLabelEl.id;
  try {
    await userClick(selectLabelEl.parent());
  } catch (e) {
    throw new Error(`Unable to find select with label: "${selectLabel}"`)
  }
  const options = Selector('ul').withAttribute('aria-labelledby', selectId);
  if (!(await options.exists)) {
    throw new Error(`Unable to find select option list labelled by id: "${selectId}"`)
  }
  return options;
}

When(/^I open select with label "(.+)" and select "(.+)" option$/, async (t: TestController, [selectLabel, optionLabel]: [string, string]) => {
  const options = await openSelect(selectLabel);

  try {
    const option = options.find('li').withExactText(optionLabel);
    await userClick(option);
  } catch (e) {
    throw new Error(`Unable to find select option with label: "${optionLabel}"`);
  }
});

When(/^I can't see option with label "(.+)" in select with label "(.+)"$/, async (t: TestController, [optionLabel, selectLabel]: [string, string]) => {
  const options = await openSelect(selectLabel);
  const optionExists = await options
    .find('li').withExactText(optionLabel).exists;

  if (optionExists) {
    throw new Error(`Option with label ${optionLabel} still exists in select with label ${selectLabel}`);
  }
});
