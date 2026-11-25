import { test as base, expect } from '@playwright/test';
import { MessagingPage } from '../pages/messaging-page';
import { createLogger } from './logger';

type Fixtures = {
  logger: ReturnType<typeof createLogger>;
  /** A MessagingPage that has already opened the app. Register API mocks via `page` before sending. */
  messagingPage: MessagingPage;
}

export const test = base.extend<Fixtures>({
  logger: async ({ }, use, testInfo) => {
    const logger = createLogger();
    try {
      await use(logger);
    } finally {
      await testInfo.attach('Test Summary', {
        body: logger.get(),
        contentType: 'text/plain',
      });
    }
  },
  messagingPage: async ({ page, logger }, use) => {
    const messagingPage = new MessagingPage(page, logger);
    await messagingPage.open();
    await use(messagingPage);
  },
});

export { expect };
