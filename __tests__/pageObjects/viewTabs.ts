import { Selector } from 'testcafe';
import userClick from '../utils/userClick';
import endpointsView from './endpointsView';

export default function viewTabs() {
  return {
    async goToEndpointsTab() {
      const selector = Selector('button').withAttribute('role', 'tab').withText('ENDPOINTS');

      await userClick(selector);

      return endpointsView();
    },
  }
}
