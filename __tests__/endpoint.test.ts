import 'testcafe';
import { APP_URL } from '../server/config';
import getApplication from './pageObjects/getApplication';

fixture`User can add, test and delete endpoint`.page(APP_URL);

const endpointLabel = 'GET: test/:it/good/:id';

test('add endpoint', async () => {
  const { getApplicationBar, getViewTabs, views } = getApplication();

  await getApplicationBar().changeStateScenario('test');
  await getViewTabs().goToEndpointsTab();

  const endpointsView = await views.getEndpointsView();
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

  await stateUpdateSection.editStateUpdate();
  await stateUpdateSection.backToResponseSection();
  await responseSection.goToStateUpdateSection();

  const submitSection = await stateUpdateSection.goToSubmitSection();

  await submitSection.submitEndpoint();
  await endpointsView.checkEndpointExists(endpointLabel);
});

test('test endpoint', async () => {
  const { getApplicationBar, getViewTabs, views } = getApplication();

  await getApplicationBar().changeStateScenario('test');
  await getViewTabs().goToEndpointsTab();

  const endpointsView = await views.getEndpointsView();

  await endpointsView.toggleEndpoint(endpointLabel);

  const testEndpointView = await endpointsView.getTestEndpointView();

  await testEndpointView.fillUrlParameter('it', '12');
  await testEndpointView.fillUrlParameter('id', 'foo');
  await testEndpointView.fillQueryParameter('test', '1234');
  await testEndpointView.fillQueryParameter('test2', 'abc');
  await testEndpointView.addRequestBody();
  await testEndpointView.testIt(
    JSON.stringify(
      {
        body: null,
        parameters: {
          test: '1234',
          test2: 'abc',
        },
        urlParameters: {
          it: '12',
          id: 'foo',
        },
      },
      null,
      2,
    ),
  );
  await testEndpointView.closeWizard();
});

test('delete endpoint', async t => {
  const { getApplicationBar, getViewTabs, views } = getApplication();

  await getApplicationBar().changeStateScenario('test');
  await getViewTabs().goToEndpointsTab();

  const endpointsView = await views.getEndpointsView();

  const endpoint = await endpointsView.toggleEndpoint(endpointLabel);
  await endpoint.deleteEndpoint();
});
