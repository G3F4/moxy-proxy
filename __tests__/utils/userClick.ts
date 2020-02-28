import { Selector, t } from 'testcafe';

export default async function userClick(selector: Selector) {
  const delay = 200;

  if (delay) {
    await t.wait(delay);
  }

  await t.click(selector);
}
