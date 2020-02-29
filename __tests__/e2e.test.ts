import 'testcafe';
import { PORT } from '../server/config';
import applicationBar from './pageObjects/appBar';
import endpointsView from './pageObjects/endpointsView';
import viewTabs from './pageObjects/viewTabs';

fixture `Fixture`
  .page `http://localhost:${PORT}`;

test('User can test endpoint', async () => {
  await applicationBar().stateScenario().selectOption('test');
  await viewTabs().goToEndpointsTab();
  const { switchMethod, testEndpoint, toggleEndpoint } = await endpointsView();
  await toggleEndpoint('Group URL: test');
  await switchMethod('PUT');
  await switchMethod('DELETE');
  await switchMethod('GET');
  const { fillQueryParameter, testIt, addRequestBody, closeWizard } = await testEndpoint();
  await fillQueryParameter('test', '1234');
  await addRequestBody();
  await testIt('0');
  await closeWizard();
});

test('User can add endpoint', async () => {
  await applicationBar().stateScenario().selectOption('test');
  await viewTabs().goToEndpointsTab();
  const { addEndpoint } = await endpointsView();
  const { enterUrl, goToMethodSection } = await addEndpoint();
  await enterUrl('test/:it/good/:testId');
  const { chooseMethod, goToUrlParametersSection } = await goToMethodSection();
  await chooseMethod('POST');
  await chooseMethod('DELETE');
  await chooseMethod('PUT');
  await chooseMethod('PATCH');
  await chooseMethod('GET');
  const { goToResponseSection } = await goToUrlParametersSection();
  const { goToStateUpdateSection } = await goToResponseSection();
  const { goToSubmitSection } = await goToStateUpdateSection();
  const { submitEndpoint } = await goToSubmitSection();
  await submitEndpoint();
});
