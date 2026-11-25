import { copyFile } from 'node:fs/promises';
import path from 'node:path';
import type { Reporter } from '@playwright/test/reporter';

export const REPORT_DIR = 'playwright-report';

export function datedReportName(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}-${date.getFullYear()}.html`;
}

// The HTML reporter writes index.html in onEnd; onExit runs after every reporter has finished.
export default class DatedReportReporter implements Reporter {
  async onExit(): Promise<void> {
    const reportDir = path.resolve(REPORT_DIR);
    await copyFile(path.join(reportDir, 'index.html'), path.join(reportDir, datedReportName()));
  }
}
