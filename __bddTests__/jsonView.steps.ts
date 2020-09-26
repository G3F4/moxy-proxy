import { Then } from 'cucumber';
import { Selector } from 'testcafe';
import TestController from './TestController';

Then(/^I see "(.+)" line in JSON viewer$/, async (t: TestController, [lineText]: [string]) => {
  const jsonViewer = await Selector('.react-json-view');
  const line = await jsonViewer.find('div').withExactText(lineText);

  await t.expect(line.exists).ok(`Unable to find line: ${lineText} in JSON Viewer.`);
});
