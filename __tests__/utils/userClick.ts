import { Selector, t } from 'testcafe';

export default async function userClick(selector: Selector) {
  const elExists = await selector.exists;

  if (!elExists) {
    throw new Error('element to click doesnt exists');
  }

  return t.click(selector);
}
