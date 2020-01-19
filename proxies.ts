// Stores the currently-being-typechecked object for error messages.
let obj: any = null;
export class ServerStateProxy {
  public readonly requestCount: number;
  public readonly data: DataProxy;
  public readonly modified: boolean;
  public static Parse(d: string): ServerStateProxy {
    return ServerStateProxy.Create(JSON.parse(d));
  }
  public static Create(d: any, field: string = 'root'): ServerStateProxy {
    if (!field) {
      obj = d;
      field = "root";
    }
    if (d === null || d === undefined) {
      throwNull2NonNull(field, d);
    } else if (typeof(d) !== 'object') {
      throwNotObject(field, d, false);
    } else if (Array.isArray(d)) {
      throwIsArray(field, d, false);
    }
    checkNumber(d.requestCount, false, field + ".requestCount");
    d.data = DataProxy.Create(d.data, field + ".data");
    checkBoolean(d.modified, false, field + ".modified");
    return new ServerStateProxy(d);
  }
  private constructor(d: any) {
    this.requestCount = d.requestCount;
    this.data = d.data;
    this.modified = d.modified;
  }
}

export class DataProxy {
  public readonly test: string[] | null;
  public static Parse(d: string): DataProxy {
    return DataProxy.Create(JSON.parse(d));
  }
  public static Create(d: any, field: string = 'root'): DataProxy {
    if (!field) {
      obj = d;
      field = "root";
    }
    if (d === null || d === undefined) {
      throwNull2NonNull(field, d);
    } else if (typeof(d) !== 'object') {
      throwNotObject(field, d, false);
    } else if (Array.isArray(d)) {
      throwIsArray(field, d, false);
    }
    checkArray(d.test, field + ".test");
    if (d.test) {
      for (let i = 0; i < d.test.length; i++) {
        checkString(d.test[i], false, field + ".test" + "[" + i + "]");
      }
    }
    if (d.test === undefined) {
      d.test = null;
    }
    return new DataProxy(d);
  }
  private constructor(d: any) {
    this.test = d.test;
  }
}

function throwNull2NonNull(field: string, d: any): never {
  return errorHelper(field, d, "non-nullable object", false);
}
function throwNotObject(field: string, d: any, nullable: boolean): never {
  return errorHelper(field, d, "object", nullable);
}
function throwIsArray(field: string, d: any, nullable: boolean): never {
  return errorHelper(field, d, "object", nullable);
}
function checkArray(d: any, field: string): void {
  if (!Array.isArray(d) && d !== null && d !== undefined) {
    errorHelper(field, d, "array", true);
  }
}
function checkNumber(d: any, nullable: boolean, field: string): void {
  if (typeof(d) !== 'number' && (!nullable || (nullable && d !== null && d !== undefined))) {
    errorHelper(field, d, "number", nullable);
  }
}
function checkBoolean(d: any, nullable: boolean, field: string): void {
  if (typeof(d) !== 'boolean' && (!nullable || (nullable && d !== null && d !== undefined))) {
    errorHelper(field, d, "boolean", nullable);
  }
}
function checkString(d: any, nullable: boolean, field: string): void {
  if (typeof(d) !== 'string' && (!nullable || (nullable && d !== null && d !== undefined))) {
    errorHelper(field, d, "string", nullable);
  }
}
function errorHelper(field: string, d: any, type: string, nullable: boolean): never {
  if (nullable) {
    type += ", null, or undefined";
  }
  throw new TypeError('Expected ' + type + " at " + field + " but found:\n" + JSON.stringify(d) + "\n\nFull object:\n" + JSON.stringify(obj));
}
