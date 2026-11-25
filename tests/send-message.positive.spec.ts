import { expect, test } from '../utils/fixtures';
import { mockSendMessageSuccess } from '../utils/mock-response';

test.describe('Send message — positive scenarios', () => {
  test('completes the happy flow with a 200 response', async ({ page, messagingPage }) => {
    const api = await mockSendMessageSuccess(page);

    await messagingPage.sendMessage('Hello, team!');

    await expect(messagingPage.messages).toHaveText(['Hello, team!']);
    await expect(messagingPage.messageInput).toHaveValue('');
    expect(api.requests).toEqual([{ message: 'Hello, team!' }]);
  });

  test('appends sequential successful messages in order', async ({ page, messagingPage }) => {
    const api = await mockSendMessageSuccess(page);

    await messagingPage.sendMessage('First message');
    await expect(messagingPage.messages).toHaveText(['First message']);

    await messagingPage.sendMessage('Second message');
    await expect(messagingPage.messages).toHaveText(['First message', 'Second message']);
    await expect(messagingPage.messageInput).toHaveValue('');

    expect(api.requests).toEqual([{ message: 'First message' }, { message: 'Second message' }]);
  });

  test('sends and accepts the expected request and response schema', async ({ page, messagingPage }) => {
    const api = await mockSendMessageSuccess(page, { reply: 'Accepted message' });
    const responsePromise = page.waitForResponse(
      (response) => response.url().endsWith('/api/send-message') && response.request().method() === 'POST',
    );

    await messagingPage.sendMessage('Schema-valid message');
    const response = await responsePromise;

    expect(api.requests).toEqual([{ message: 'Schema-valid message' }]);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ success: true, message: expect.any(String) });
    await expect(messagingPage.messages).toHaveText(['Accepted message']);
    await expect(messagingPage.messageInput).toHaveValue('');
  });

  test('shows the message only after a delayed response arrives', async ({ page, messagingPage }) => {
    await mockSendMessageSuccess(page, { delayMs: 500 });

    await messagingPage.sendMessage('Slow hello');

    await expect(messagingPage.messages).toHaveCount(0);
    await expect(messagingPage.messages).toHaveText(['Slow hello']);
  });

  test('renders HTML-like text as plain text', async ({ page, messagingPage }) => {
    await mockSendMessageSuccess(page);

    await messagingPage.sendMessage('<b>bold</b>');

    await expect(messagingPage.messages).toHaveText(['<b>bold</b>']);
    await expect(messagingPage.messages.locator('b')).toHaveCount(0);
  });
});
