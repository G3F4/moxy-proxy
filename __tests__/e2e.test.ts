import 'testcafe';
import { PORT } from '../server/config';
import applicationBar from './pageObjects/appBar';
import endpointsView from './pageObjects/endpointsView';
import viewTabs from './pageObjects/viewTabs';

fixture `Fixture`
  .page `http://localhost:${PORT}`;

//test('User can test endpoint', async () => {
//  await applicationBar().stateScenario().selectOption('test');
//  await viewTabs().goToEndpointsTab();
//  const { switchMethod, testEndpoint, toggleEndpoint } = await endpointsView();
//  await toggleEndpoint('Group URL: test');
//  await switchMethod('PUT');
//  await switchMethod('DELETE');
//  await switchMethod('GET');
//  const { fillQueryParameter, testIt, addRequestBody, closeWizard } = await testEndpoint();
//  await fillQueryParameter('test', '1234');
//  await addRequestBody();
//  await testIt('0');
//  await closeWizard();
//});

test('User can add endpoint', async (t) => {
  await applicationBar().stateScenario().selectOption('test');
  const endpointsView = await viewTabs().goToEndpointsTab();
  const urlSection = await endpointsView.addEndpoint();
  await urlSection.enterUrl('test/:it/good/:testId');
  const methodSection = await urlSection.goToMethodSection();
  await methodSection.chooseMethod('POST');
  await methodSection.chooseMethod('DELETE');
  await methodSection.backToUrlSection();
  await urlSection.deleteUrl(6);
  await urlSection.enterUrl('id');
  await urlSection.goToMethodSection();
  await methodSection.chooseMethod('PUT');
  await methodSection.chooseMethod('PATCH');
  await methodSection.chooseMethod('GET');
  const urlParametersSection = await methodSection.goToUrlParametersSection();
  await urlParametersSection.addUrlParameter('test', 'Boolean');
  await urlParametersSection.addUrlParameter('test2', 'String');
  const responseSection = await urlParametersSection.goToResponseSection();
  await responseSection.editResponse();
  await responseSection.backToUrlSection();
  await urlParametersSection.goToResponseSection();
  const stateUpdateSection = await responseSection.goToStateUpdateSection();
  await stateUpdateSection.backToResponseSection();
  await urlParametersSection.goToResponseSection();
  const submitSection = await stateUpdateSection.goToSubmitSection();
  await submitSection.submitEndpoint();
});
