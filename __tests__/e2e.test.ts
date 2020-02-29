import 'testcafe';
import { PORT } from '../server/config';
import applicationBar from './pageObjects/appBar';
import endpointsView from './pageObjects/endpointsView';
import viewTabs from './pageObjects/viewTabs';

fixture `Fixture`
  .page `http://localhost:${PORT}`;

test('User can test endpoint', async user => {
  await applicationBar().stateScenario().selectOption('test');
  await viewTabs().goToEndpointsTab();
  const { switchMethod, testEndpoint, toggleEndpoint } = await endpointsView();
  await toggleEndpoint('Group URL: test');
  await switchMethod('PUT');
  await switchMethod('DELETE');
  await switchMethod('GET');
  const { fillQueryParameter, testIt, addRequestBody } = await testEndpoint();
  await fillQueryParameter('test', '1234');
  await addRequestBody();
  const response = await testIt();
  await user.expect(response).eql('0');
  await user.wait(5000);
});

test('User can add endpoint', async t => {
  await applicationBar().stateScenario().selectOption('test');
  await viewTabs().goToEndpointsTab();
  const { addEndpoint } = await endpointsView();
  const { urlSection } = await addEndpoint();
  const { enterUrl, toToMethodSection } = urlSection();
  await enterUrl('test/:it/good/:testId');
  const { chooseMethod, toToUrlParametersSection } = await toToMethodSection();
  await chooseMethod('POST');
  await chooseMethod('DELETE');
  await chooseMethod('PUT');
  await chooseMethod('PATCH');
  await chooseMethod('GET');
  const { goToResponseSection } = await toToUrlParametersSection();
  const { goToStateUpdateSection } = await goToResponseSection();
  const { goToSubmitSection } = await goToStateUpdateSection();
  const { submitEndpoint } = await goToSubmitSection();
  await submitEndpoint();
  await t.wait(5000);
});
