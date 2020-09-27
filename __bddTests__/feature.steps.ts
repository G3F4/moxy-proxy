import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { AfterAll, BeforeAll } from 'cucumber';
import {
  APP_URL,
  CLIENT_HOSTNAME,
  SERVER_START_MESSAGE,
} from '../server/config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const stripAnsi = require('strip-ansi');
let serverSubprocess: ChildProcessWithoutNullStreams;
let clientHostSubprocess: ChildProcessWithoutNullStreams;

async function startApp(ctx: any) {
  return new Promise((resolve, reject) => {
    let serverStarted = false;
    let clientHostStarted = false;

    function tryResolve() {
      if (serverStarted && clientHostStarted) {
        console.log(['app started hosting']);
        resolve();
      }
    }

    serverSubprocess = spawn('yarn', ['run:server']);
    clientHostSubprocess = spawn('yarn', ['host:client']);
    serverSubprocess.stdout.on('data', (data) => {
      const out = stripAnsi(data.toString().trim());

      console.log(['server:out'], out);

      if (out === SERVER_START_MESSAGE) {
        serverStarted = true;
        tryResolve();
      }
    });
    clientHostSubprocess.stdout.on('data', (data) => {
      const [out] = stripAnsi(data.toString().trim()).split('\n');

      if (out.startsWith(CLIENT_HOSTNAME)) {
        clientHostStarted = true;
        ctx.host = out;
        tryResolve();
      }
    });

    setTimeout(() => {
      reject(new Error('Application not started within time limit.'));
    }, 25000);
  });
}

function stopApp(ctx: any) {
  console.log(['stopApp'], ctx);
  serverSubprocess.kill();
  clientHostSubprocess.kill();
}

BeforeAll('@BeforeAll', async (ctx: any) => {
  await startApp(ctx);
});

AfterAll('@AfterAll', async (ctx: any) => {
  stopApp(ctx);
});
