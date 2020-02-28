import { Selector, t } from 'testcafe';

export default async function userWrite(selector: Selector, text: string) {
  const delay = 200;

  if (delay) {
    await t.wait(delay);
  }

  await t.typeText(selector, text);
}
