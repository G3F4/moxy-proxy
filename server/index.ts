import { App } from 'uWebSockets.js';
import { readFileSync } from 'fs';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

App().any('/*', (response, request) => {
  try {
    const url = request.getUrl() && request.getUrl() !== '/' ? request.getUrl() : '/index.html';
    const file = readFileSync(`${process.cwd()}/build${url}`);
    
    response.end(file);
  } catch (e) {
    console.error(`error: ${e.toString()}`);
    response.end(e.toString());
  }
}).listen(PORT, (listenSocket) => {
  if (listenSocket) {
    console.log(`Listening to port: ${PORT}`);
  }
});