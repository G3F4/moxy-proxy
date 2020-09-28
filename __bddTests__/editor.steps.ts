import { Then } from 'cucumber';
import { Selector } from 'testcafe';
import userClick from '../__tests__/utils/userClick';

const editorSelector = '.monaco-editor';

Then('I click editor to set cursor at the end of last line', async () => {
  const monacoEditor = await Selector(editorSelector);

  await userClick(monacoEditor);
});

async function waitForEditorLoad() {
  const monacoEditor = await Selector(editorSelector, { timeout: 10000 });
  const loaded = await monacoEditor.exists;

  if (!loaded) {
    await waitForEditorLoad();
  }
}

Then('I wait for editor to load', async () => {
  await waitForEditorLoad();
});
