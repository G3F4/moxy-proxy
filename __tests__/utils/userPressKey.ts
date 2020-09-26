import { t } from 'testcafe';
import randomUserDelay from './randomUserDelay';

export interface UserPressKeyOptions {
  times?: number;
  holdingShift?: boolean;
  holdingAlt?: boolean;
}

interface UserPressKeyArg extends UserPressKeyOptions {
  key: string;
}

export default async function userPressKey({
  key,
  times = 1,
  holdingShift = false,
  holdingAlt = false,
}: UserPressKeyArg) {
  let keys = key;

  if (holdingShift) {
    keys = `shift+${keys}`;
  }

  if (holdingAlt) {
    keys = `alt+${keys}`;
  }

  const delay = randomUserDelay();

  await t.wait(delay);

  for (let i = 0; i < times; i++) {
    await t.pressKey(keys, { speed: 0.2 });
  }
}
