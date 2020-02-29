import { Selector, t } from 'testcafe';
import randomUserDelay from './randomUserDelay';

export default async function userWrite(selector: Selector, text: string) {
  const delay = randomUserDelay();

  if (delay) {
    await t.wait(delay);
  }

  await t.typeText(selector, text);
}
