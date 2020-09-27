export const PORT = process.env.PORT || '5000';
export const CLIENT_PORT = process.env.CLIENT_PORT || '8080';
export const DATA_DIR = process.env.DATA_DIR || 'mockedData';
export const CLIENT_HOSTNAME =
  process.env.CLIENT_HOSTNAME || 'http://127.0.0.1';
export const APP_URL =
  process.env.APP_URL || `${CLIENT_HOSTNAME}:${CLIENT_PORT}`;
export const SERVER_START_MESSAGE = 'Application up and running.';
