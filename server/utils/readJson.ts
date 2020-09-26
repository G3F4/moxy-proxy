export function readJson(res: any, cb: (json: unknown) => void, err: any) {
  let buffer: Buffer;

  res.onData((ab: ArrayBuffer, isLast: boolean) => {
    try {
      const chunk = Buffer.from(ab);

      if (isLast) {
        if (buffer) {
          cb(JSON.parse(Buffer.concat([buffer, chunk]).toString()));
        } else {
          cb(JSON.parse(chunk.toString()));
        }
      } else {
        if (buffer) {
          buffer = Buffer.concat([buffer, chunk]);
        } else {
          buffer = Buffer.concat([chunk]);
        }
      }
    } catch (e) {
      cb({});
    }
  });

  res.onAborted(err);
}

export async function readJsonAsync(res: any) {
  return new Promise(function (resolve, reject) {
    readJson(res, resolve, reject);
  });
}
