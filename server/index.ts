import { App, HttpRequest, WebSocket } from 'uWebSockets.js';
import { readFileSync } from 'fs';
import {Method, Route} from '../sharedTypes';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

let serverState = {
  requestCount: 0,
};

let routes: Route[] = [{
  method: 'get',
  url: '/test',
  responseCode: `
((state) => {
  return {
    requestCount: state.requestCount
  };
})(state, request);
`,
  serverStateUpdateCode: `
((state) => {
  return {
    ...state,
  };
})(state, request);
`,
}, {
  method: 'put',
  url: '/test',
  responseCode: `
((state) => {
  return {};
})(state, request);
`,
  serverStateUpdateCode: `
((state) => {
  return {
    ...state,
    requestCount: state.requestCount
      ? state.requestCount + 1
      : 1
  };
})(state, request);
`,
}, {
  method: 'delete',
  url: '/test',
  responseCode: `
((state) => {
  return {};
})(state, request);
`,
  serverStateUpdateCode: `
((state) => {
  return {
    ...state,
    requestCount: state.requestCount
      ? state.requestCount - 1
      : 0
  };
})(state, request);
`,
}, {
  method: 'post',
  url: '/test',
  responseCode: `
((state, { body }) => {
  return {};
})(state, request);
`,
  serverStateUpdateCode: `
((state, { body }) => {
  return {
    ...state,
    data: body
  };
})(state, request);
`
}, {
  method: 'patch',
  url: '/test',
  responseCode: `
((state, { body }) => {
  return 'patched!';
})(state, request);
`,
  serverStateUpdateCode: `
((state, { body }) => {
  return {
    ...state,
    requestCount: body.requestCount
  };
})(state, request);
`
}];

function updateServerState(serverStateUpdate: Partial<typeof serverState>) {
  serverState = {
    ...serverState,
    ...serverStateUpdate
  };
}

function addRoute(route: Route) {
  routes = [...routes, route];
}

const sendEvent = (socket: WebSocket, action: string, payload: any): void => {
  try {
    socket.send(JSON.stringify({ action, payload }));
  }
  
  catch (e) {
    console.error(e);
  }
};

/* Helper function for reading a posted JSON body */
function readJson(res: any, cb: any, err: any) {
  let buffer: any;
  /* Register data cb */
  res.onData((ab: ArrayBuffer, isLast: boolean) => {
    try {
      let chunk = Buffer.from(ab);
      if (isLast) {
        if (buffer) {
          // @ts-ignore
          cb(JSON.parse(Buffer.concat([buffer, chunk])));
        } else {
          // @ts-ignore
          cb(JSON.parse(chunk));
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
  
  /* Register error cb */
  res.onAborted(err);
}

async function readJsonAsync(res: any) {
  return new Promise(function(resolve, reject) {
    readJson(res, resolve, reject);
  });
}

const Sockets: WebSocket[] = [];

function broadcast(event: { action: string, payload: any }) {
  Sockets.forEach(socket => {
    socket.send(JSON.stringify(event));
  });
}

App().ws('/*', {
  message: (ws, message) => {
    // @ts-ignore
    const { action, payload } = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(message)));
    console.log(['ws:message:action'], action);
    console.log(['ws:message:payload'], payload);
    if (action === 'addRoute') {
      addRoute(payload);
      sendEvent(ws,'updateRoutes', routes);
    }
  },
  open: (ws: WebSocket, req: HttpRequest) => {
    Sockets.push(ws);
    ws.send(JSON.stringify({
      action: 'updateServerState',
      payload: serverState,
    }));
    ws.send(JSON.stringify({
      action: 'updateRoutes',
      payload: routes,
    }));
    console.log(['ws:open'], req);
  },
  close: (ws: WebSocket, code: number, message: ArrayBuffer) => {
    console.log(['ws:close'], code, message);
  }
}).any('/*', async (res, req) => {
  try {
    const method = req.getMethod() as Method;
    const url = req.getUrl() !== '/' ? req.getUrl() : '/index.html';
    const urlLastChar = url[url.length - 1];
    const rawUrl = urlLastChar === '/' ? url.slice(0, -1) : url;
    const route = routes.find(route => route.url === rawUrl && route.method === method);
    console.log(['method'], method);
    console.log(['url'], url);
    
    if (route) {
      const requestBody = await readJsonAsync(res);
      console.log(['requestBody'], requestBody);
      
      const request = {
        body: requestBody,
      };
      
      const responseCodeStart = `return `;
      
      const effectiveResponseCode = responseCodeStart + route.responseCode.trim();
      const effectiveServerStateUpdateCode = responseCodeStart + route.serverStateUpdateCode.trim();
      
      const responseFunction = new Function('state', 'request', effectiveResponseCode);
      const serverStateUpdateFunction = new Function('state', 'request', effectiveServerStateUpdateCode);
      
      const responseFunctionReturn = responseFunction(serverState, request);
      const updatedServerStateReturn = serverStateUpdateFunction(serverState, request);
      
      console.log(['responseFunctionReturn'], responseFunctionReturn);
      console.log(['updatedServerStateReturn'], updatedServerStateReturn);
      
      updateServerState(updatedServerStateReturn);
      
      broadcast({
        action: 'updateServerState',
        payload: serverState,
      });
      
      res.end(JSON.stringify(responseFunctionReturn));
    } else {
      const file = readFileSync(`${process.cwd()}/build${url}`);
    
      res.end(file);
    }
  } catch (e) {
    console.error(`error: ${e.toString()}`);
    res.writeStatus('404');
    res.end();
  }
}).listen(PORT, (listenSocket) => {
  if (listenSocket) {
    console.log(`Listening to port: ${PORT}`);
  }
});

// curl -i --header "Content-Type: application/json" --request GET  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request PUT  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request DELETE  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request PATCH --data '{ "requestCount: 12 "}'  http://localhost:5000/test
// curl -i --header "Content-Type: application/json" --request POST --data '{ "secret": true }'  http://localhost:5000/test
