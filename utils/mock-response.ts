import type { Page } from '@playwright/test';

export const SEND_MESSAGE_API = '**/api/send-message';

export interface SendMessageRequest {
  message: string;
}

export interface SendMessageMock {
  /** Request bodies received by the mocked endpoint, in order. */
  readonly requests: SendMessageRequest[];
}

interface SuccessOptions {
  /** Text returned by the API; defaults to echoing the submitted message. */
  reply?: string;
  /** Artificial latency before responding. */
  delayMs?: number;
}

export async function mockSendMessageSuccess(
  page: Page,
  { reply, delayMs = 0 }: SuccessOptions = {},
): Promise<SendMessageMock> {
  const requests: SendMessageRequest[] = [];
  await page.route(SEND_MESSAGE_API, async (route) => {
    const body = route.request().postDataJSON() as SendMessageRequest;
    requests.push(body);
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    await route.fulfill({ status: 200, json: { success: true, message: reply ?? body.message } });
  });
  return { requests };
}

export async function mockSendMessageHttpError(page: Page, status: 400 | 401 | 429 | 500): Promise<SendMessageMock> {
  const requests: SendMessageRequest[] = [];
  await page.route(SEND_MESSAGE_API, (route) => {
    requests.push(route.request().postDataJSON() as SendMessageRequest);
    return route.fulfill({ status, json: { success: false, error: `HTTP ${status} Error` } });
  });
  return { requests };
}

export async function mockSendMessageNetworkAbort(page: Page): Promise<SendMessageMock> {
  const requests: SendMessageRequest[] = [];
  await page.route(SEND_MESSAGE_API, (route) => {
    requests.push(route.request().postDataJSON() as SendMessageRequest);
    return route.abort('aborted');
  });
  return { requests };
}

export async function mockSendMessageInvalidResponseSchema(page: Page): Promise<SendMessageMock> {
  const requests: SendMessageRequest[] = [];
  await page.route(SEND_MESSAGE_API, (route) => {
    requests.push(route.request().postDataJSON() as SendMessageRequest);
    return route.fulfill({ status: 200, json: { success: false } });
  });
  return { requests };
}
