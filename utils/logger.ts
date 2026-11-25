export function createLogger() {
  let logs: string[] = [];
  return {
    log: (msg: string) => {
      const line = `[INFO] ${msg}`;
      logs.push(line);
    },
    error: (msg: string) => {
      const line = `[ERROR] ${msg}`;
      logs.push(line);
    },
    warn: (msg: string) => {
      const line = `[WARN] ${msg}`;
      logs.push(line);
    },
    get: () => logs.join('\n'),
    clear: () => { logs = []; }
  };
}





