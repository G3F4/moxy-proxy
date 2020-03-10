import { Selector, t } from 'testcafe';
import userClick from '../utils/userClick';
import { getTestEndpointView } from './getTestEndpointView';
import getAddEndpointView from './getAddEndpointView';

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
        await t.debug();

        throw new Error(`Endpoint with label "${label}" does not exists`);
      }

      await userClick(endpointPanel);

      return {
        async testEndpoint() {
          return getTestEndpointView(endpointContainer);
        },
        async deleteEndpoint() {
          const openTestDialogButton = endpointContainer
            .find('button')
            .withText('DELETE');

          await userClick(openTestDialogButton);
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
      return getTestEndpointView(getViewContainer());
    },
    async addEndpoint() {
      return getAddEndpointView(getViewContainer());
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
