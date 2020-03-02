import { t } from 'testcafe';
import randomUserDelay from './randomUserDelay';

export default async function userWait(random = true, fixedDelay = 100) {
  const delay = random ? randomUserDelay() : fixedDelay;

  return t.wait(delay);
}
