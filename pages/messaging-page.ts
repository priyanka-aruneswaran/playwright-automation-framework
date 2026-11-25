import type { Locator, Page } from '@playwright/test';
import { createLogger } from '../utils/logger';

type Logger = {
  log(message: string): void;
}

export class MessagingPage {
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly messages: Locator;
  private readonly page: Page;
  private readonly logger: Logger;

  constructor(page: Page, logger: Logger = createLogger()) {
    this.page = page;
    this.logger = logger;
    this.messageInput = this.page.getByPlaceholder('Type your message...');
    this.sendButton = this.page.getByRole('button', { name: 'Send' });
    this.messages = this.page.getByRole('list').getByRole('listitem');
  }

  async open(): Promise<void> {
    await this.page.goto('/');
    this.logger.log('Messaging page opened');
  }

  async sendMessage(text: string): Promise<void> {
    await this.messageInput.fill(text);
    this.logger.log(`Filled message input - ${text}`);
    await this.sendButton.click();
    this.logger.log('Clicked send button');
  }
}


