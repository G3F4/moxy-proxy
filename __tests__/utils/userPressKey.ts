import { t } from 'testcafe';
import randomUserDelay from './randomUserDelay';

export default async function userPressKey(key: string) {
  const delay = randomUserDelay();

  return t.wait(delay).pressKey(key);
}
