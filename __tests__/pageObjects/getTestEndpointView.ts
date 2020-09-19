import { Selector, t } from 'testcafe';
import userClick from '../utils/userClick';
import userWrite from '../utils/userWrite';

export async function getTestEndpointView(viewContainer: Selector) {
  const openTestDialogButton = viewContainer
    .find('button')
    .withText('TEST ENDPOINT');
  const testEndpointViewContainer = Selector('div').withAttribute(
    'role',
    'dialog',
  );
  const queryParametersContainer = testEndpointViewContainer
    .find('h6')
    .withText('Fill query parameters')
    .parent();
  const urlParametersContainer = testEndpointViewContainer
    .find('h6')
    .withText('Fill url parameters')
    .parent();

  await userClick(openTestDialogButton);

  return {
    async closeWizard() {
      const closeButton = testEndpointViewContainer
        .find('button')
        .withAttribute('aria-label', 'close');

      await userClick(closeButton);
    },
    async fillQueryParameter(name: string, value: string) {
      const element = queryParametersContainer
        .find('label')
        .withText(name)
        .parent()
        .find('input');

      await userWrite(element, value);
    },
    async fillUrlParameter(name: string, value: string) {
      const element = urlParametersContainer
        .find('label')
        .withText(name)
        .parent()
        .find('input');

      await userWrite(element, value);
    },
    async addRequestBody() {
      const element = testEndpointViewContainer
        .find('span')
        .withText('ADD REQUEST BODY');

      await userClick(element);
    },
    // TODO testcafe nie ma problemy z api clipboard
    // copyUrlToClipboard() {
    //   const element = testEndpointViewContainer.find('button').withText('COPY CURL TO CLIPBOARD');
    //
    //   userClick(element);
    // },
    async testIt(expectedResponse: string) {
      const element = testEndpointViewContainer.find('span').withText('TEST');

      await userClick(element);

      const responseSection = testEndpointViewContainer
        .find('p')
        .withText('Response')
        .parent();
      const response = await responseSection.find('code').textContent;

      await t.expect(response).eql(expectedResponse);
    },
  };
}
