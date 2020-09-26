import { Selector, t } from 'testcafe';
import randomUserDelay from './randomUserDelay';

export default async function userClick(selector: Selector) {
  const elExists = await selector.exists;

  if (!elExists) {
    throw new Error('element to click doesnt exists');
  }

  const delay = randomUserDelay();

  return t.click(selector);
}
