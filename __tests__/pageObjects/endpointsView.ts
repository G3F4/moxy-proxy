import { Selector, t } from 'testcafe';
import userClick from '../utils/userClick';
import userWrite from '../utils/userWrite';

async function nextStep(container: Selector) {
  const button = container.find('button').withText('NEXT');

  await assertSectionActive(container);

  await userClick(button);
}

async function previousStep(container: Selector) {
  const button = container.find('button').withText('BACK');

  await assertSectionActive(container);

  await userClick(button);
}

async function assertSectionActive(container: Selector) {
  const sectionContent = container.find('div');
  const contentAttributes = await sectionContent.attributes;

  if (contentAttributes.disabled === '') {
    throw new Error('section is not active');
  }
}

async function submitSection(wizardContainer: Selector) {
  const section = wizardContainer
    .find('span')
    .withText('Update server state')
    .parent('div');

  await t
    .expect(section.exists)
    .ok('section container doesnt exists');

  return {
    async submitEndpoint() {
      const submitButton = wizardContainer.find('button').withText('SUBMIT');

      await userClick(submitButton);
    },
    async backToStateUpdateSection() {
      await previousStep(section);

      return stateUpdateSection(wizardContainer);
    },
  };
}

async function stateUpdateSection(wizardContainer: Selector) {
  const section = wizardContainer
    .find('span')
    .withText('Update server state')
    .parent('div');

  await t
    .expect(section.exists)
    .ok('section container doesnt exists');

  return {
    async goToSubmitSection() {
      await nextStep(section);

      return submitSection(wizardContainer);
    },
    async backToResponseSection() {
      await previousStep(section);

      return responseSection(wizardContainer);
    },
  };
}

async function responseSection(wizardContainer: Selector) {
  const section = wizardContainer
    .find('span')
    .withText('Define response')
    .parent('div');

  await t
    .expect(section.exists)
    .ok('section container doesnt exists');

  return {
    async editResponse() {
      const editButton = section.find('button').withText('EDIT');
      const doneButton = section.find('button').withText('DONE');
      const editor = section.find('div').withAttribute('data-keybinding-context', '1');

      await userClick(editButton);
      await userWrite(editor, 's');
      await t.pressKey('backspace');
      await t.pressKey('end');
      await t.pressKey('down');
      await t.pressKey('end');
      await t.pressKey('left');
      await userWrite(editor, '.test');
      await userClick(doneButton);
    },
    async goToStateUpdateSection() {
      await nextStep(section);

      return stateUpdateSection(wizardContainer);
    },
    async backToUrlSection() {
      await previousStep(section);

      return urlParametersSection(wizardContainer);
    },
  };
}

async function urlParametersSection(wizardContainer: Selector) {
  const section = wizardContainer
    .find('span')
    .withText('Add parameters')
    .parent('div');

  await t
    .expect(section.exists)
    .ok('section container doesnt exists');

  return {
    async addUrlParameter(name: string, type: string) {
      const addParameterButton = section
        .find('button')
        .withText('ADD PARAMETER');
      const parameterNameInput = section
        .find('label')
        .withText('Parameter name')
        .nth(-1)
        .parent()
        .find('input');
      const parameterType = section
        .find('label')
        .withText('Parameter type')
        .nth(-1)
        .parent();
      const parameterTypeOption = Selector('ul')
        .withAttribute('aria-labelledby', 'parameter-typ-label')
        .find('li')
        .withText(type);

      await userClick(addParameterButton);
      await userWrite(parameterNameInput, name);
      await userClick(parameterType);
      await userClick(parameterTypeOption);
    },
    async goToResponseSection() {
      await nextStep(section);

      return responseSection(wizardContainer);
    },
    async backToMethodSectionSection() {
      await previousStep(section);

      return methodSection(wizardContainer);
    },
  };
}

async function methodSection(wizardContainer: Selector) {
  const section = wizardContainer
    .find('span')
    .withText('Select request type')
    .parent('div');

  await t
    .expect(section.exists)
    .ok('section container doesnt exists');

  return {
    async chooseMethod(method: string) {
      const methodButton = section
        .find('button')
        .withText(method);

      await userClick(methodButton);
    },
    async goToUrlParametersSection() {
      await nextStep(section);

      return urlParametersSection(wizardContainer);
    },
    async backToUrlSection() {
      await previousStep(section);

      return urlSection(wizardContainer);
    },
  };
}

async function urlSection(wizardContainer: Selector) {
  const section = wizardContainer
    .find('span')
    .withText('URL pattern')
    .parent('div');

  await t
    .expect(section.exists)
    .ok('section container doesnt exists');

  return {
    async enterUrl(url: string) {
      const urlInput = section.find('input');

      await userWrite(urlInput, url);
    },
    async deleteUrl(charCountToRemove = 1) {
      for (let i = 0; i < charCountToRemove; i++) {
        await t.pressKey('backspace');
      }
    },
    async goToMethodSection() {
      await nextStep(section);

      return methodSection(wizardContainer);
    },
  };
}

async function testEndpoint(viewContainer: Selector) {
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
      const response = responseSection.find('code');

      await t.expect(response.textContent).eql(expectedResponse);
    },
  };
}

export default async function endpointsView() {
  const viewContainer = Selector('h5')
    .withText('Endpoints')
    .parent()
    .parent();

  await t.expect(viewContainer.exists).ok('view container doesnt exists');

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
      const addEndpointButton = viewContainer
        .find('button')
        .withText('ADD ENDPOINT');
      await userClick(addEndpointButton);

      const wizardContainer = Selector('div').withAttribute('role', 'dialog');

      return urlSection(wizardContainer);
    },
  };
}
