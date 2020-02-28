import { Selector } from 'testcafe';
import userClick from '../utils/userClick';
import userWrite from '../utils/userWrite';

export default function endpointsView() {
  const viewContainer = Selector('h5').withText('Endpoints').parent().parent();

  return {
    async toggleEndpoint(label: string) {
      const element = viewContainer.find('div').withAttribute('role', 'button').withText(label);

      await userClick(element);
    },
    async switchMethod(method: string) {
      const element = viewContainer.find('button').withAttribute('role', 'tab').withText(method);

      await userClick(element);
    },
    async testEndpoint() {
      const openTestDialogButton = viewContainer.find('button').withText('TEST ENDPOINT');
      const testEndpointViewContainer = Selector('div').withAttribute('role', 'dialog');
      const queryParametersContainer = testEndpointViewContainer.find('h6').withText('Fill query parameters').parent();
      await userClick(openTestDialogButton);

      return {
        async fillQueryParameter(name: string, value: string) {
          const element = queryParametersContainer.find('label').withText(name).parent().find('input');

          await userWrite(element, value);
        },
        async addRequestBody() {
          const element = testEndpointViewContainer.find('span').withText('ADD REQUEST BODY');

          await userClick(element);
        },
        // TODO testcafe nie ma problemy z api clipboard
        // async copyUrlToClipboard() {
        //   const element = testEndpointViewContainer.find('button').withText('COPY CURL TO CLIPBOARD');
        //
        //   await userClick(element);
        // },
        async testIt() {
          const element = testEndpointViewContainer.find('span').withText('TEST');

          await userClick(element);

          const responseSection = testEndpointViewContainer.find('p').withText('Response').parent();
          const code = await responseSection.find('code');

          return code.textContent;
        },
      }
    }
  }
}
