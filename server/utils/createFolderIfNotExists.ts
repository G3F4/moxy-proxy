import { existsSync, mkdirSync } from 'fs';

export default function createFolderIfNotExists(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path);
  }
}
