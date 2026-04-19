import { describe, expect, test, vi } from "vitest";

const {
  getConfiguredReplyToAddressMock,
  getConfiguredSenderAddressMock,
  sendTransactionalEmailMock,
} = vi.hoisted(() => ({
  getConfiguredReplyToAddressMock: vi.fn(() => ({
    email: "reply@example.com",
    name: "Reply Team",
  })),
  getConfiguredSenderAddressMock: vi.fn(() => ({
    email: "support@example.com",
    name: "Support Team",
  })),
  sendTransactionalEmailMock: vi.fn(),
}));

vi.mock("./sendgrid", () => ({
  getConfiguredReplyToAddress: getConfiguredReplyToAddressMock,
  getConfiguredSenderAddress: getConfiguredSenderAddressMock,
  sendTransactionalEmail: sendTransactionalEmailMock,
}));

import { buildTicketReplyEmail, sendTicketReplyEmail } from "./ticket-email";

describe("ticket email helpers", () => {
  test("builds a transactional message with SendGrid fields and thread headers", () => {
    const message = buildTicketReplyEmail({
      bodyText: "Line 1\nLine 2",
      customer: {
        email: "customer@example.com",
        name: "Taylor",
      },
      externalMessageId: "<ticket-1@example.com>",
      subject: "Refund request",
    });

    expect(message).toEqual({
      from: {
        email: "support@example.com",
        name: "Support Team",
      },
      headers: {
        "In-Reply-To": "<ticket-1@example.com>",
        References: "<ticket-1@example.com>",
      },
      html: expect.stringContaining("Line 1<br />Line 2"),
      replyTo: {
        email: "reply@example.com",
        name: "Reply Team",
      },
      subject: "Re: Refund request",
      text: "Line 1\nLine 2",
      to: {
        email: "customer@example.com",
        name: "Taylor",
      },
    });
    expect(message.html).toContain("Code with MasterHong Support");
  });

  test("preserves reply subjects that already start with Re:", () => {
    const message = buildTicketReplyEmail({
      bodyText: "Body",
      customer: {
        email: "customer@example.com",
        name: "Taylor",
      },
      externalMessageId: null,
      subject: "Re: Existing thread",
    });

    expect(message.subject).toBe("Re: Existing thread");
    expect(message.headers).toBeUndefined();
  });

  test("delegates outbound delivery to SendGrid", async () => {
    await sendTicketReplyEmail({
      bodyText: "Body",
      customer: {
        email: "customer@example.com",
        name: "Taylor",
      },
      externalMessageId: null,
      subject: "Question",
    });

    expect(sendTransactionalEmailMock).toHaveBeenCalledTimes(1);
    expect(sendTransactionalEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Re: Question",
        text: "Body",
      }),
    );
  });
});
