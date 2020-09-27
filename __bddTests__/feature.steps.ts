import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { AfterAll, BeforeAll } from 'cucumber';

let subprocess: ChildProcessWithoutNullStreams;

async function startApp() {
  subprocess = spawn('yarn', ['run', 'test:bdd:app']);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 5000);
  });
}

function stopApp() {
  subprocess.kill();
}

BeforeAll('@BeforeAll', async () => {
  await startApp();
});

AfterAll('@AfterAll', async () => {
  stopApp();
});
