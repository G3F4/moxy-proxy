import { existsSync, readFileSync, writeFileSync } from 'fs';

export default class FileService {
  constructor(
    readonly cwd: string,
    readonly readSync: typeof readFileSync,
    readonly writeSync: typeof writeFileSync,
    readonly exists: typeof existsSync,
  ) {
  }

  checkIfExist(path: string): boolean {
    return this.exists(`${this.cwd}/${path}`);
  }

  readJSON<T extends unknown>(path: string): T {
    return JSON.parse(this.readSync(`${this.cwd}/${path}`, 'utf8'));
  }

  saveJSON(path: string, data: unknown) {
    this.writeSync(`${this.cwd}/${path}`, JSON.stringify(data, null, 2), 'utf-8');
  }

  readText(path: string): string {
    return this.readSync(`${this.cwd}/${path}`, 'utf8');
  }

  saveText(path: string, text: string, options: { openToAppend?: boolean } = {}) {
    if (options.openToAppend) {
      this.writeSync(`${this.cwd}/${path}`, text, { flag: 'wx' });
    } else {
      this.writeSync(`${this.cwd}/${path}`, text);
    }
  }
}

export const fileService = new FileService(process.cwd(), readFileSync, writeFileSync, existsSync);
