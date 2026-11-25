import { expect, test } from '../utils/fixtures';
import {
  SEND_MESSAGE_API,
  mockSendMessageHttpError,
  mockSendMessageInvalidResponseSchema,
  mockSendMessageNetworkAbort,
  mockSendMessageSuccess,
} from '../utils/mock-response';

test.describe('Send message — negative scenarios', () => {
  test('does not call the API for an empty message', async ({ page, messagingPage, logger }) => {
    const api = await mockSendMessageSuccess(page);

    await messagingPage.sendButton.click();
    logger.log('Clicked send button');

    await expect(messagingPage.messages).toHaveCount(0);
    expect(api.requests).toHaveLength(0);
  });

  test('does not add a whitespace-only message when the API rejects it', async ({ page, messagingPage }) => {
    const api = await mockSendMessageHttpError(page, 400);

    await messagingPage.sendMessage('   \t ');

    await expect(messagingPage.messages).toHaveCount(0);
    await expect(messagingPage.messageInput).toHaveValue('   \t ');
    expect(api.requests).toEqual([{ message: '   \t ' }]);
  });

  const errorStatuses: Array<400 | 401 | 429 | 500> = [500, 429, 400, 401];
  for (const status of errorStatuses) {
    test(`does not add a message when the API returns ${status}`, async ({ page, messagingPage }) => {
      await mockSendMessageHttpError(page, status);
      const message = `HTTP ${status} failure`;
      const responsePromise = page.waitForResponse(
        (response) => response.url().endsWith('/api/send-message') && response.request().method() === 'POST',
      );

      await messagingPage.sendMessage(message);
      const response = await responsePromise;

      expect(response.status()).toBe(status);
      expect(await response.json()).toEqual({ success: false, error: expect.any(String) });
      await expect(messagingPage.messages).toHaveCount(0);
      await expect(messagingPage.messageInput).toHaveValue(message);
    });
  }

  test('retains the message when the network request is aborted', async ({ page, messagingPage }) => {
    const api = await mockSendMessageNetworkAbort(page);
    const failedRequest = page.waitForEvent(
      'requestfailed',
      (request) => request.url().endsWith('/api/send-message') && request.method() === 'POST',
    );
    const message = 'Network failure';

    await messagingPage.sendMessage(message);
    const request = await failedRequest;

    expect(request.failure()).not.toBeNull();
    expect(api.requests).toEqual([{ message }]);
    await expect(messagingPage.messages).toHaveCount(0);
    await expect(messagingPage.messageInput).toHaveValue(message);
  });

  test('does not add a message when the response violates the expected schema', async ({ page, messagingPage }) => {
    const api = await mockSendMessageInvalidResponseSchema(page);
    const responsePromise = page.waitForResponse(
      (response) => response.url().endsWith('/api/send-message') && response.request().method() === 'POST',
    );
    await messagingPage.sendMessage('Malformed response');
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    expect(api.requests).toEqual([{ message: 'Malformed response' }]);
    await expect(messagingPage.messages).toHaveCount(0);
    await expect(messagingPage.messageInput).toHaveValue('Malformed response');
  });

  test('rejects a request that does not match the request schema', async ({ page }) => {
    let receivedBody: unknown;
    await page.route(SEND_MESSAGE_API, async (route) => {
      receivedBody = route.request().postDataJSON();
      const body = receivedBody as { message?: unknown };
      const valid = typeof body.message === 'string' && body.message.trim().length > 0;
      await route.fulfill({
        status: valid ? 200 : 400,
        json: valid
          ? { success: true, message: body.message }
          : { success: false, error: 'Invalid request schema' },
      });
    });

    await page.goto('/');
    const response = await page.evaluate(async () => {
      const result = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return result.status;
    });

    expect(receivedBody).toEqual({});
    expect(response).toBe(400);
  });
});
