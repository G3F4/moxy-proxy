import { existsSync, promises, readFileSync, writeFileSync } from 'fs';
import createFolderIfNotExists from '../../utils/createFolderIfNotExists';
import { logError, logInfo } from '../../utils/logger';

const rimraf = require('rimraf');

function isDirEmpty(dirname: string) {
  return promises.readdir(dirname).then(files => files.length === 0);
}

export default class FileService {

  constructor(
    readonly cwd: string,
  ) {
  }

  checkIfExist(path: string): boolean {
    return existsSync(`${this.cwd}/${path}`);
  }

  deleteFile(path: string) {
    logInfo(['deleteFile'], path);

    const absolutePath = `${this.cwd}${path}`;

    rimraf(absolutePath, (error: Error) => {
      if (error) {
        logError(['error deleting file'], JSON.stringify(error));
      }

      setTimeout(async () => {
        const folder = absolutePath.substring(0, absolutePath.lastIndexOf('/'));
        const dirEmpty = await isDirEmpty(folder);

        if (dirEmpty) {
          rimraf(folder, (error: Error) => {
            if (error) {
              logError(['error deleting folder'], JSON.stringify(error));
            }

            logInfo(['folder deleted'], folder);
          });
        }
      }, 1000)
    });
  }

  readJSON<T extends unknown>(path: string): T {
    return JSON.parse(readFileSync(`${this.cwd}/${path}`, 'utf8'));
  }

  saveJSON(path: string, data: unknown): void {
    writeFileSync(`${this.cwd}/${path}`, JSON.stringify(data, null, 2), 'utf-8');
  }

  readText(path: string): string {
    return readFileSync(`${this.cwd}/${path}`, 'utf8');
  }

  saveText(path: string, text: string): void {
    const fileExists = this.checkIfExist(path);

    if (fileExists) {
      writeFileSync(path, text);
    } else {
      writeFileSync(path, text, { flag: 'wx' });
    }
  }

  checkFolder(path: string) {
    const folders = path.split('/');

    folders.forEach((item, index, arr) => {
      const path = `${this.cwd}/${arr.slice(0, index + 1).join('/')}`;

      createFolderIfNotExists(path);
    });
  }
}
