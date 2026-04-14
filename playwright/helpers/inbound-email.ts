import type { APIRequestContext } from "@playwright/test";

export type InboundEmailPayload = {
  messageId?: string;
  from: {
    email: string;
    name: string;
  };
  subject: string;
  text: string;
  category?: "general" | "technical" | "refund_request";
  receivedAt?: string;
};

function getSecret() {
  const secret = process.env.INBOUND_EMAIL_SECRET?.trim();

  if (!secret) {
    throw new Error("INBOUND_EMAIL_SECRET is required for webhook tests.");
  }

  return secret;
}

function getBaseUrl() {
  const url = process.env.BETTER_AUTH_URL?.trim();

  if (!url) {
    throw new Error("BETTER_AUTH_URL is required for webhook tests.");
  }

  return url;
}

export async function sendInboundEmail(
  request: APIRequestContext,
  payload: InboundEmailPayload,
) {
  return request.post(new URL("/api/inbound/email", getBaseUrl()).toString(), {
    data: payload,
    headers: {
      "x-inbound-email-secret": getSecret(),
    },
  });
}
