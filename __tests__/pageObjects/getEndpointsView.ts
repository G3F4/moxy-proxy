import { Selector, t } from 'testcafe';
import userClick from '../utils/userClick';
import userPressKey from '../utils/userPressKey';
import userWait from '../utils/userWait';
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

function getCodeEditor(container: Selector) {
  async function getEditButton() {
    return container.find('button').withText('EDIT');
  }

  async function getDoneButton() {
    return container.find('button').withText('DONE');
  }

  async function getEditor() {
    return container.find('div').withAttribute('data-keybinding-context', '1');
  }

  async function waitForEditorWithRetry(retriesCount = 3) {
    const editor = await getEditor();
    const editorAfterWaitExists = await editor.exists;

    if (!editorAfterWaitExists) {
      if (retriesCount === 0) {
        throw new Error('Editor loading timeout');
      }

      await userWait();

      await waitForEditorWithRetry(retriesCount - 1);
    }
  }

  return {
    async startEditing() {
      const editButton = await getEditButton();
      const doneButton = await getDoneButton();
      const editor = await getEditor();

      await userClick(editButton);

      const editorLoaded = await doneButton.exists;
      const editorExists = await editor.exists;

      if (!editorLoaded || !editorExists) {
        await waitForEditorWithRetry(25);
      }

      await userClick(editor);
    },
    async enterCode(code: string) {
      const editor = await getEditor();

      await userWrite(editor, code);
    },
    async doneEditing() {
      const doneButton = await getDoneButton();

      await userWait();

      await userClick(doneButton);
    },
  };
}

async function assertSectionActive(container: Selector) {
  const sectionContent = container.find('div');
  const icon = container.find('svg');
  const iconFirstChildrenTagName = await icon.child(0).tagName;
  const contentAttributes = await sectionContent.attributes;
  const sectionCompleted = iconFirstChildrenTagName === 'path';
  const sectionDisabled = contentAttributes.disabled === '';

  if (sectionDisabled || sectionCompleted) {
    throw new Error('section is not active');
  }
}

async function submitSection(wizardContainer: Selector) {
  const section = wizardContainer
    .find('span')
    .withText('Update server state')
    .parent('div');

  await t.expect(section.exists).ok('section container doesnt exists');

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

  await t.expect(section.exists).ok('section container doesnt exists');

  return {
    async editStateUpdate() {
      const codeEditor = await getCodeEditor(section);

      await codeEditor.startEditing();
      await userPressKey('up');
      await userPressKey('up');
      await userPressKey('end');
      await userPressKey('left');
      await userPressKey('backspace');
      await userPressKey('backspace');
      await userPressKey('backspace');
      await userPressKey('backspace');
      await codeEditor.enterCode('false ');
      await userPressKey('backspace');
      await codeEditor.doneEditing();
    },
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

  await t.expect(section.exists).ok('section container doesnt exists');

  return {
    async editResponse() {
      const codeEditor = await getCodeEditor(section);

      await codeEditor.startEditing();
      await userPressKey('up');
      await userPressKey('end');
      await userPressKey('left');
      await codeEditor.enterCode('.requestCount ');
      await userPressKey('backspace');
      await codeEditor.doneEditing();
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

  await t.expect(section.exists).ok('section container doesnt exists');

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

  await t.expect(section.exists).ok('section container doesnt exists');

  return {
    async chooseMethod(method: string) {
      const methodButton = section.find('button').withText(method);

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

  await t.expect(section.exists).ok('section container doesnt exists');

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
      const response = responseSection.find('code');

      await t.expect(response.textContent).eql(expectedResponse);
    },
  };
}

async function deleteEndpoint(viewContainer: Selector) {
  const openTestDialogButton = viewContainer.find('button').withText('DELETE');

  await userClick(openTestDialogButton);
}

export default async function getEndpointsView() {
  function getViewContainer() {
    return Selector('h5')
      .withText('Endpoints')
      .parent()
      .parent();
  }

  await t.expect(getViewContainer().exists).ok('view container doesnt exists');

  return {
    async toggleEndpoint(label: string) {
      const endpointPanel = getViewContainer()
        .find('div')
        .withAttribute('role', 'button')
        .withText(label);
      const endpointContainer = endpointPanel
        .parent()
        .find('div')
        .withAttribute('role', 'region');

      const endpointPanelExists = await endpointPanel.exists;
      const endpointContainerExists = await endpointContainer.exists;


      if (!endpointPanelExists || !endpointContainerExists) {
        console.log(['endpointPanelExists'], endpointPanelExists);
        console.log(['endpointContainerExists'], endpointContainerExists);
        await t.debug();
        throw new Error(`Endpoint with label "${label}" does not exists`);
      }

      await userClick(endpointPanel);

      return {
        async testEndpoint() {
          return testEndpoint(endpointContainer);
        },
        async deleteEndpoint() {
          await deleteEndpoint(endpointContainer);
        },
      };
    },
    async switchMethod(method: string) {
      const element = getViewContainer()
        .find('button')
        .withAttribute('role', 'tab')
        .withText(method);

      await userClick(element);
    },
    getTestEndpointView() {
      return testEndpoint(getViewContainer());
    },
    async addEndpoint() {
      const addEndpointButton = getViewContainer()
        .find('button')
        .withText('ADD ENDPOINT');

      await userClick(addEndpointButton);

      const wizardContainer = Selector('div').withAttribute('role', 'dialog');

      return urlSection(wizardContainer);
    },
    async checkEndpointExists(endpointLabel: string) {
      const element = getViewContainer()
        .find('div')
        .withAttribute('role', 'button')
        .withText(endpointLabel);

      await t.expect(await element.exists).ok('Endpoint does not exists');
    },
  };
}
