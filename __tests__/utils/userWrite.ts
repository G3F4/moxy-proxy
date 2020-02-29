import { Selector, t } from 'testcafe';
import randomUserDelay from './randomUserDelay';

export default async function userWrite(selector: Selector, text: string) {
  await t
    .expect(selector.exists)
    .ok('element to write doesnt exists');

  const delay = randomUserDelay();

  if (delay) {
    await t.wait(delay);
  }

  await t.typeText(selector, text);
}
