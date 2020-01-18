// Stores the currently-being-typechecked object for error messages.
let obj: any = null;
export class RootNameProxy {
  public readonly requestCount: number;
  public readonly data: DataProxy;
  public static Parse(d: string): RootNameProxy {
    return RootNameProxy.Create(JSON.parse(d));
  }
  public static Create(d: any, field: string = 'root'): RootNameProxy {
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
    return new RootNameProxy(d);
  }
  private constructor(d: any) {
    this.requestCount = d.requestCount;
    this.data = d.data;
  }
}

export class DataProxy {
  public readonly requestCount: number;
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
    checkNumber(d.requestCount, false, field + ".requestCount");
    return new DataProxy(d);
  }
  private constructor(d: any) {
    this.requestCount = d.requestCount;
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
function checkNumber(d: any, nullable: boolean, field: string): void {
  if (typeof(d) !== 'number' && (!nullable || (nullable && d !== null && d !== undefined))) {
    errorHelper(field, d, "number", nullable);
  }
}
function errorHelper(field: string, d: any, type: string, nullable: boolean): never {
  if (nullable) {
    type += ", null, or undefined";
  }
  throw new TypeError('Expected ' + type + " at " + field + " but found:\n" + JSON.stringify(d) + "\n\nFull object:\n" + JSON.stringify(obj));
}
