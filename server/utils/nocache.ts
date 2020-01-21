import { watchFile } from 'fs';

export function nocache(module: string) {
  watchFile(require('path').resolve(module), () => {
    delete require.cache[require.resolve(module)];
  });
}
