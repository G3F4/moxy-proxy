import { App, HttpRequest, WebSocket } from 'uWebSockets.js';
import { readFileSync } from 'fs';
import {Method, Route} from '../sharedTypes';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

let serverState = {
  empty: true,
};

let routes: Route[] = [{
  method: 'get',
  url: '/test',
  responseCode: `
function responseReturn(serverState, requestBody) {
    return {
        serverEmpty: serverState.empty
    };
}

return responseReturn(serverState, requestBody);
`,
  serverStateUpdateCode: `
function stateUpdate(serverState, requestBody) {
    return {
        ...serverState,
        ...requestBody,
    };
}

return stateUpdate(serverState, requestBody);
`,
}, {
  method: 'post',
  url: '/test',
  responseCode: `
function responseReturn(serverState, requestBody) {
    return {
        serverEmpty: serverState.empty
    };
}

return responseReturn(serverState, requestBody);
`,
  serverStateUpdateCode: `
function stateUpdate(serverState, requestBody) {
    return {
        ...serverState,
        ...requestBody,
    };
}

return stateUpdate(serverState, requestBody);
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
  res.onData((ab, isLast) => {
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
}).any('/*', async (response, request) => {
  try {
    const method = request.getMethod() as Method;
    const url = request.getUrl() !== '/' ? request.getUrl() : '/index.html';
    const urlLastChar = url[url.length - 1];
    const rawUrl = urlLastChar === '/' ? url.slice(0, -1) : url;
    const route = routes.find(route => route.url === rawUrl && route.method === method);
    console.log(['method'], method);
    console.log(['url'], url);
    console.log(['route'], route);
    
    if (route) {
      const requestBody = await readJsonAsync(response);
      console.log(['requestBody'], requestBody);
      
      const responseFunction = new Function('serverState', 'requestBody', route.responseCode);
      const serverStateUpdateFunction = new Function('serverState', 'requestBody', route.serverStateUpdateCode);
      
      const responseFunctionReturn = responseFunction(serverState, requestBody);
      const updatedServerStateReturn = serverStateUpdateFunction(serverState, requestBody);
      
      console.log(['responseFunctionReturn'], responseFunctionReturn)
      console.log(['updatedServerStateReturn'], updatedServerStateReturn)
      
      updateServerState(updatedServerStateReturn);
      
      response.end(JSON.stringify(responseFunctionReturn));
    } else {
      const file = readFileSync(`${process.cwd()}/build${url}`);
    
      response.end(file);
    }
  } catch (e) {
    console.error(`error: ${e.toString()}`);
    response.writeStatus('404');
    response.end();
  }
}).listen(PORT, (listenSocket) => {
  if (listenSocket) {
    console.log(`Listening to port: ${PORT}`);
  }
});

// curl --header "Content-Type: application/json" --request POST --data '{"items": [{ "value": 1, "text": "test" }]}' http://localhost:5000/test