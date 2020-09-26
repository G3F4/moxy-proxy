import { t } from 'testcafe';

export interface UserTypesOptions {
  holdingShift?: boolean;
  holdingAlt?: boolean;
}

export default async function userTypes(
  text: string,
  options: UserTypesOptions = {},
) {
  const { holdingAlt, holdingShift } = options;
  const keys = text.split('').join(' ');
  const speed = 0.01;

  if (holdingShift) {
    await t.pressKey(`shift+${keys}`, { speed });
  } else if (holdingAlt) {
    await t.pressKey(`alt+${keys}`, { speed });
  } else {
    await t.pressKey(keys, { speed });
  }
}
