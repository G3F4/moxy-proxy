import { Selector, t } from 'testcafe';
import randomUserDelay from './randomUserDelay';

export default async function userClick(selector: Selector) {
  await t.expect(selector.exists).ok('element to click doesnt exists');

  const delay = randomUserDelay();

  return t.wait(delay).click(selector);
}
