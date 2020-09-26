import { Then } from 'cucumber';
import { Selector } from 'testcafe';
import TestController from './TestController';

Then(/^I see "(.+)" line in JSON viewer$/, async (t: TestController, [lineText]: [string]) => {
  const jsonViewer = await Selector('.react-json-view');
  const divLine = await jsonViewer.find('div').withExactText(lineText).exists;
  const spanLine = await jsonViewer.find('span').withExactText(lineText).exists;

  if (!divLine && !spanLine) {
    throw new Error(`Unable to find line: ${lineText} in JSON Viewer.`)
  }
});
