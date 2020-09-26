import { Then } from 'cucumber';
import { Selector } from 'testcafe';
import userClick from '../__tests__/utils/userClick';
import TestController from './TestController';

Then(/^I click editor to focus editor input$/, async (t: TestController, [lineText]: [string]) => {
  const monacoEditor = await Selector('.monaco-editor');
  await userClick(monacoEditor);
});
