export interface ServerState {
  requestCount: number;
  data: Data;
}
export interface Data {
  test?: (string)[] | null;
}
