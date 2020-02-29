import { Selector, t } from 'testcafe';
import randomUserDelay from './randomUserDelay';

export default async function userClick(selector: Selector) {
  const delay = randomUserDelay();

  if (delay) {
    await t.wait(delay);
  }

  await t.click(selector);
}
