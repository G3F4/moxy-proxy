import { Selector } from 'testcafe';

const appHeaderSelector = Selector('h6').withText('Moxy Proxy');
const endpointTabSelector = Selector('span').withText('ENDPOINTS');
const addEndpointSelector = Selector('button').withText('ADD ENDPOINT');

fixture `Fixture`
  .page `http://localhost:5000`;

test('User can add endpoint', async t => {
  await t.expect(appHeaderSelector.exists).ok({ timeout: 1000 });
  await t.click(endpointTabSelector);
  await t.click(addEndpointSelector);
  await t.takeScreenshot('test.png');
});
