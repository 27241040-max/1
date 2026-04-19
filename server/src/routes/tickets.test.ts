import type { AddressInfo } from "node:net";

import express from "express";
import { beforeEach, describe, expect, test, vi } from "vitest";

const { prismaMock, sendTicketReplyEmailMock } = vi.hoisted(() => ({
  prismaMock: {
    ticket: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    ticketReply: {
      create: vi.fn(),
    },
  },
  sendTicketReplyEmailMock: vi.fn(),
}));

vi.mock("../middleware/require-auth", () => ({
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = {
      banned: false,
      banExpires: null,
      banReason: null,
      createdAt: new Date("2026-04-17T00:00:00.000Z"),
      email: "agent@example.com",
      emailVerified: true,
      id: "agent-id",
      image: null,
      name: "Agent Smith",
      role: "agent",
      updatedAt: new Date("2026-04-17T00:00:00.000Z"),
    };
    next();
  },
}));

vi.mock("../prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("../lib/ticket-email", () => ({
  sendTicketReplyEmail: sendTicketReplyEmailMock,
}));

vi.mock("../lib/ai/polish-ticket-reply", () => ({
  polishTicketReply: vi.fn(),
}));

vi.mock("../lib/ai/summarize-ticket-thread", () => ({
  summarizeTicketThread: vi.fn(),
}));

import { ticketsRouter } from "./tickets";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/", ticketsRouter);
  return app;
}

async function postReply(ticketId: number, body: Record<string, unknown>) {
  const server = createApp().listen(0);
  const { port } = server.address() as AddressInfo;

  try {
    return await fetch(`http://127.0.0.1:${port}/${ticketId}/replies`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

describe("ticketsRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.ticket.findUnique.mockResolvedValueOnce({
      customer: {
        email: "customer@example.com",
        name: "Taylor",
      },
      externalMessageId: "<message-1@example.com>",
      id: 7,
      subject: "Refund request",
    });
    prismaMock.ticketReply.create.mockResolvedValue({ id: 1001 });
    prismaMock.ticket.findUnique.mockResolvedValueOnce({
      assignedUser: null,
      bodyText: "Original ticket body",
      category: "refund_request",
      createdAt: new Date("2026-04-14T08:00:00.000Z").toISOString(),
      customer: {
        email: "customer@example.com",
        id: 1,
        name: "Taylor",
      },
      id: 7,
      replies: [
        {
          author: {
            email: "agent@example.com",
            id: "agent-id",
            name: "Agent Smith",
          },
          authorLabel: "Agent Smith",
          bodyText: "Thanks for your patience.",
          createdAt: new Date("2026-04-14T10:00:00.000Z").toISOString(),
          id: 1001,
          source: "agent",
          updatedAt: new Date("2026-04-14T10:00:00.000Z").toISOString(),
        },
      ],
      source: "email",
      status: "open",
      subject: "Refund request",
      updatedAt: new Date("2026-04-14T10:00:00.000Z").toISOString(),
    });
  });

  test("sends the email before persisting an agent reply", async () => {
    const response = await postReply(7, {
      bodyText: "Thanks for your patience.",
    });

    expect(response.status).toBe(200);
    expect(sendTicketReplyEmailMock).toHaveBeenCalledWith({
      bodyText: "Thanks for your patience.",
      customer: {
        email: "customer@example.com",
        name: "Taylor",
      },
      externalMessageId: "<message-1@example.com>",
      subject: "Refund request",
    });
    expect(prismaMock.ticketReply.create).toHaveBeenCalledWith({
      data: {
        authorLabel: "Agent Smith",
        authorUserId: "agent-id",
        bodyText: "Thanks for your patience.",
        source: "agent",
        ticketId: 7,
      },
    });
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        id: 7,
        subject: "Refund request",
      }),
    );
  });

  test("does not persist a reply when SendGrid delivery fails", async () => {
    sendTicketReplyEmailMock.mockRejectedValueOnce(new Error("delivery failed"));

    const response = await postReply(7, {
      bodyText: "Thanks for your patience.",
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "邮件发送失败，请稍后再试。",
    });
    expect(prismaMock.ticketReply.create).not.toHaveBeenCalled();
  });
});
