import { t } from 'testcafe';

export default async function userWait(seconds = 1) {
  const delay = seconds * 1000;

  return t.wait(delay);
}
