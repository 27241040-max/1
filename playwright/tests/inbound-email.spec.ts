import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import { sendInboundEmail } from "../helpers/inbound-email";

test("webhook: inbound email creates a ticket and is idempotent by messageId", async ({
  request,
}) => {
  const id = randomUUID().slice(0, 8);
  const payload = {
    messageId: `msg-${id}`,
    from: {
      email: `webhook.${id}@example.com`,
      name: `Webhook ${id}`,
    },
    subject: `Webhook ticket ${id}`,
    text: `Webhook body ${id}`,
    category: "general" as const,
  };

  const first = await sendInboundEmail(request, payload);
  expect(first.status()).toBe(201);

  const firstBody = await first.json();
  expect(firstBody).toMatchObject({
    created: true,
  });
  expect(firstBody.ticketId).toEqual(expect.any(Number));

  const second = await sendInboundEmail(request, payload);
  expect(second.status()).toBe(200);

  const secondBody = await second.json();
  expect(secondBody).toMatchObject({
    created: false,
    ticketId: firstBody.ticketId,
  });
});
