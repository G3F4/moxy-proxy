import 'testcafe';
import { PORT } from '../server/config';
import appBar from './pageObjects/appBar';
import endpointsView from './pageObjects/endpointsView';
import viewTabs from './pageObjects/viewTabs';

fixture `Fixture`
  .page `http://localhost:${PORT}`;

test('User can test endpoint', async t => {
  await appBar().stateScenario().selectOption('test');
  await viewTabs().goToEndpointsTab();
  await endpointsView().toggleEndpoint('Group URL: test');
  await endpointsView().switchMethod('PUT');
  await endpointsView().switchMethod('DELETE');
  await endpointsView().switchMethod('GET');
  const { fillQueryParameter, testIt, addRequestBody } = await endpointsView().testEndpoint();
  await fillQueryParameter('test', '1234');
  await addRequestBody();
  const response = await testIt();
  await t.expect(response).eql('0');
});
