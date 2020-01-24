import { watch } from 'fs';
import { resolve } from 'path';

export function nocache(module: string) {
  return watch(resolve(module), () => {
    delete require.cache[require.resolve(module)];
  });
}
