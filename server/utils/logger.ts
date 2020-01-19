export function logInfo(...args: unknown[]) {
  setTimeout(() => {
    console.info(...args);
  }, 0);
}

export function logError(...args: unknown[]) {
  setTimeout(() => {
    console.error(...args);
  }, 0);
}
