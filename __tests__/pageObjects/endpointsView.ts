import { Selector, t } from 'testcafe';
import userClick from '../utils/userClick';
import userWrite from '../utils/userWrite';

async function nextStep(container: Selector) {
  const button = container.find('button').withText('NEXT');

  await userClick(button);
}

async function previousStep(container: Selector) {
  const button = container.find('button').withText('BACK');

  await userClick(button);
}

function submitSection(wizardContainer: Selector) {
  const submitSectionContainer = wizardContainer
    .find('span')
    .withText('Update server state')
    .parent('div');

  return {
    async submitEndpoint() {
      const submitButton = wizardContainer.find('button').withText('SUBMIT');

      await userClick(submitButton);
    },
    async backToStateUpdateSection() {
      await previousStep(submitSectionContainer);

      return stateUpdateSection(wizardContainer);
    },
  };
}

function stateUpdateSection(wizardContainer: Selector) {
  const stateUpdateSectionContainer = wizardContainer
    .find('span')
    .withText('Update server state')
    .parent('div');

  return {
    async goToSubmitSection() {
      await nextStep(stateUpdateSectionContainer);

      return submitSection(wizardContainer);
    },
    async backToResponseSection() {
      await previousStep(stateUpdateSectionContainer);

      return responseSection(wizardContainer);
    },
  };
}

function responseSection(wizardContainer: Selector) {
  const responseSectionContainer = wizardContainer
    .find('span')
    .withText('Define response')
    .parent('div');

  return {
    async goToStateUpdateSection() {
      await nextStep(responseSectionContainer);

      return stateUpdateSection(wizardContainer);
    },
    async backToUrlSection() {
      await previousStep(responseSectionContainer);

      return urlParametersSection(wizardContainer);
    },
  };
}

function urlParametersSection(wizardContainer: Selector) {
  const urlParametersSectionContainer = wizardContainer
    .find('span')
    .withText('Define response')
    .parent('div');

  return {
    async goToResponseSection() {
      await nextStep(urlParametersSectionContainer);

      return responseSection(wizardContainer);
    },
    async backToMethodSectionSection() {
      await previousStep(urlParametersSectionContainer);

      return methodSection(wizardContainer);
    },
  };
}

async function methodSection(wizardContainer: Selector) {
  const methodSectionContainer = wizardContainer
    .find('span')
    .withText('Select request type')
    .parent('div');

  return {
    async chooseMethod(method: string) {
      const methodButton = methodSectionContainer.find('button').withText(method);

      await userClick(methodButton);
    },
    async goToUrlParametersSection() {
      await nextStep(methodSectionContainer);

      return urlParametersSection(wizardContainer);
    },
    async backToUrlSection() {
      await previousStep(methodSectionContainer);

      return urlSection(wizardContainer);
    },
  };
}

function urlSection(wizardContainer: Selector) {
  const urlSectionContainer = wizardContainer
    .find('span')
    .withText('URL pattern')
    .parent('div');

  const api = {
    async enterUrl(url: string) {
      const urlInput = urlSectionContainer.find('input');

      await userWrite(urlInput, url);

      return {
        ...api,
      };
    },
    async goToMethodSection() {
      await nextStep(urlSectionContainer);

      return methodSection(wizardContainer);
    },
  };

  return api;
}

async function testEndpoint(viewContainer: Selector) {
  const openTestDialogButton = viewContainer.find('button').withText('TEST ENDPOINT');
  const testEndpointViewContainer = Selector('div').withAttribute('role', 'dialog');
  const queryParametersContainer = testEndpointViewContainer
    .find('h6')
    .withText('Fill query parameters')
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
    async addRequestBody() {
      const element = testEndpointViewContainer.find('span').withText('ADD REQUEST BODY');

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
      const response = responseSection.find('code');

      await t.expect(response.textContent).eql(expectedResponse);
    },
  };
}

export default function endpointsView() {
  const viewContainer = Selector('h5')
    .withText('Endpoints')
    .parent()
    .parent();

  return {
    async toggleEndpoint(label: string) {
      const element = viewContainer
        .find('div')
        .withAttribute('role', 'button')
        .withText(label);

      await userClick(element);
    },
    async switchMethod(method: string) {
      const element = viewContainer
        .find('button')
        .withAttribute('role', 'tab')
        .withText(method);

      await userClick(element);
    },
    testEndpoint() {
      return testEndpoint(viewContainer);
    },
    async addEndpoint() {
      const addEndpointButton = viewContainer.find('button').withText('ADD ENDPOINT');
      await userClick(addEndpointButton);

      const wizardContainer = Selector('div').withAttribute('role', 'dialog');

      return urlSection(wizardContainer);
    },
  };
}
