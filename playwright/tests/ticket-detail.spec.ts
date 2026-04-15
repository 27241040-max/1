import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import { signInAsAdmin } from "../helpers/auth";
import { sendInboundEmail } from "../helpers/inbound-email";

test("e2e: admin can reply to a ticket and the reply persists after reload", async ({
  page,
  request,
}) => {
  const id = randomUUID().slice(0, 8);
  const subject = `Reply flow ticket ${id}`;
  const replyText = `Reply confirmation ${id}: we can schedule the training session next Tuesday afternoon.`;
  const created = await sendInboundEmail(request, {
    messageId: `reply-flow-${id}`,
    from: {
      email: `reply.flow.${id}@example.com`,
      name: `Reply Flow ${id}`,
    },
    subject,
    text: `Original request body ${id}`,
    category: "general",
  });

  expect(created.status()).toBe(201);
  const body = await created.json();
  expect(body.ticketId).toEqual(expect.any(Number));

  await signInAsAdmin(page);
  await page.goto(`/tickets/${body.ticketId}`);

  await expect(page.getByRole("heading", { name: subject })).toBeVisible();
  await expect(page.getByText("暂无回复")).toBeVisible();

  await page.getByLabel("回复内容").fill(replyText);
  await page.getByRole("button", { name: "提交回复" }).click();

  await expect(page.getByText(replyText)).toBeVisible();
  await expect(
    page.locator("article").filter({ hasText: replyText }).getByText("Administrator"),
  ).toBeVisible();
  await expect(page.getByLabel("回复内容")).toHaveValue("");

  await page.reload();

  await expect(page.getByRole("heading", { name: subject })).toBeVisible();
  await expect(page.getByText(replyText)).toBeVisible();
});
