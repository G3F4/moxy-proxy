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
    },
    async addEndpoint() {
      const addEndpointButton = viewContainer.find('button').withText('ADD ENDPOINT');
      await userClick(addEndpointButton);

      const wizardContainer = Selector('div').withAttribute('role', 'dialog');

      function submitSection() {
        const submitSectionContainer = wizardContainer.find('span').withText('Update server state').parent('div');

        return {
          async submitEndpoint() {
            const submitButton = wizardContainer.find('button').withText('SUBMIT');

            await userClick(submitButton);
          },
        }
      }

      function stateUpdateSection() {
        const stateUpdateSectionContainer = wizardContainer.find('span').withText('Update server state').parent('div');

        return {
          async goToSubmitSection() {
            const nextButton = stateUpdateSectionContainer.find('button').withText('NEXT');

            await userClick(nextButton);

            return submitSection();
          },
        }
      }

      function responseSection() {
        const responseSectionContainer = wizardContainer.find('span').withText('Define response').parent('div');

        return {
          async goToStateUpdateSection() {
            const nextButton = responseSectionContainer.find('button').withText('NEXT');

            await userClick(nextButton);

            return stateUpdateSection();
          },
        }
      }

      function urlParametersSection() {
        const urlParametersSectionContainer = wizardContainer.find('span').withText('Define response').parent('div');

        return {
          async goToResponseSection() {
            const nextButton = urlParametersSectionContainer.find('button').withText('NEXT');

            await userClick(nextButton);

            return responseSection();
          },
        };
      }

      function methodSection() {
        const methodSectionContainer = wizardContainer.find('span').withText('Select request type').parent('div');

        return {
          async chooseMethod(method: string) {
            const methodButton = methodSectionContainer.find('button').withText(method);

            await userClick(methodButton);
          },
          async toToUrlParametersSection() {
            const nextButton = methodSectionContainer.find('button').withText('NEXT');

            await userClick(nextButton);

            return urlParametersSection();
          },
        };
      }

      return {
        urlSection() {
          const enterUrlSectionContainer = wizardContainer.find('span').withText('URL pattern').parent('div');

          return {
            enterUrl(url: string) {
              const urlInput = enterUrlSectionContainer.find('input');

              userWrite(urlInput, url);
            },
            async toToMethodSection() {
              const nextButton = enterUrlSectionContainer.find('button').withText('NEXT');

              await userClick(nextButton);

              return methodSection();
            },
          }
        }
      };
    },
  }
}
