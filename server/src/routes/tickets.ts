import {
  ticketAssignmentSchema,
  ticketListQuerySchema,
  ticketReplyCreateSchema,
  ticketReplyPolishSchema,
  ticketUpdateSchema,
  type TicketSortField,
  type TicketSortOrder,
} from "core/email";
import { Router } from "express";

import { Prisma } from "../generated/prisma";
import { polishTicketReply } from "../lib/ai/polish-ticket-reply";
import { summarizeTicketThread } from "../lib/ai/summarize-ticket-thread";
import { parsePositiveIntParam } from "../lib/route-params";
import { getIssueMessage } from "../lib/validation";

import { requireAuth } from "../middleware/require-auth";
import { prisma } from "../prisma";

export const ticketsRouter = Router();

ticketsRouter.use(requireAuth);

const ticketDetailSelect = {
  id: true,
  subject: true,
  bodyText: true,
  status: true,
  category: true,
  source: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  assignedUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  replies: {
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      bodyText: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
} satisfies Prisma.TicketSelect;

function getTicketOrderBy(
  sortBy: TicketSortField,
  sortOrder: TicketSortOrder,
): Prisma.TicketOrderByWithRelationInput {
  switch (sortBy) {
    case "subject":
      return { subject: sortOrder };
    case "customer":
      return { customer: { name: sortOrder } };
    case "status":
      return { status: sortOrder };
    case "category":
      return { category: sortOrder };
    case "createdAt":
      return { createdAt: sortOrder };
  }
}

ticketsRouter.get("/", async (req, res) => {
  const result = ticketListQuerySchema.safeParse(req.query);

  if (!result.success) {
    res.status(400).json({ error: getIssueMessage(result.error) });
    return;
  }

  const where: Prisma.TicketWhereInput = {
    ...(result.data.status ? { status: result.data.status } : {}),
    ...(result.data.category ? { category: result.data.category } : {}),
    ...(result.data.q
      ? {
          OR: [
            {
              subject: {
                contains: result.data.q,
                mode: "insensitive",
              },
            },
            {
              customer: {
                email: {
                  contains: result.data.q,
                  mode: "insensitive",
                },
              },
            },
            {
              customer: {
                name: {
                  contains: result.data.q,
                  mode: "insensitive",
                },
              },
            },
          ],
        }
      : {}),
  };
  const pageSize = result.data.pageSize ?? 10;
  const page = result.data.page ?? 1;
  const skip = (page - 1) * pageSize;
  const sortBy = result.data.sortBy ?? "createdAt";
  const sortOrder = result.data.sortOrder ?? "desc";
  const [tickets, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      orderBy: [getTicketOrderBy(sortBy, sortOrder), { id: "desc" }],
      select: {
        id: true,
        subject: true,
        status: true,
        category: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      skip,
      take: pageSize,
      where,
    }),
    prisma.ticket.count({ where }),
  ]);

  res.json({
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    tickets,
  });
});

ticketsRouter.get("/:id", async (req, res) => {
  const ticketId = parsePositiveIntParam(req.params.id);

  if (!ticketId) {
    res.status(400).json({ error: "工单 ID 无效。" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: ticketDetailSelect,
  });

  if (!ticket) {
    res.status(404).json({ error: "工单不存在。" });
    return;
  }

  res.json(ticket);
});

ticketsRouter.patch("/:id", async (req, res) => {
  const ticketId = parsePositiveIntParam(req.params.id);

  if (!ticketId) {
    res.status(400).json({ error: "工单 ID 无效。" });
    return;
  }

  const result = ticketUpdateSchema.safeParse(req.body ?? {});

  if (!result.success) {
    res.status(400).json({ error: getIssueMessage(result.error) });
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });

  if (!ticket) {
    res.status(404).json({ error: "工单不存在。" });
    return;
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      category: result.data.category,
      status: result.data.status,
    },
    select: ticketDetailSelect,
  });

  res.json(updatedTicket);
});

ticketsRouter.patch("/:id/assignment", async (req, res) => {
  const ticketId = parsePositiveIntParam(req.params.id);

  if (!ticketId) {
    res.status(400).json({ error: "工单 ID 无效。" });
    return;
  }

  const result = ticketAssignmentSchema.safeParse(req.body ?? {});

  if (!result.success) {
    res.status(400).json({ error: getIssueMessage(result.error) });
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });

  if (!ticket) {
    res.status(404).json({ error: "工单不存在。" });
    return;
  }

  if (result.data.assignedUserId) {
    const agent = await prisma.user.findFirst({
      where: {
        id: result.data.assignedUserId,
        deletedAt: null,
        role: "agent",
      },
      select: { id: true },
    });

    if (!agent) {
      res.status(400).json({ error: "所选代理不存在。" });
      return;
    }
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      assignedUserId: result.data.assignedUserId,
    },
    select: ticketDetailSelect,
  });

  res.json(updatedTicket);
});

ticketsRouter.post("/:id/replies", async (req, res) => {
  const ticketId = parsePositiveIntParam(req.params.id);

  if (!ticketId) {
    res.status(400).json({ error: "工单 ID 无效。" });
    return;
  }

  const result = ticketReplyCreateSchema.safeParse(req.body ?? {});

  if (!result.success) {
    res.status(400).json({ error: getIssueMessage(result.error) });
    return;
  }

  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });

  if (!ticket) {
    res.status(404).json({ error: "工单不存在。" });
    return;
  }

  await prisma.ticketReply.create({
    data: {
      ticketId,
      authorUserId: userId,
      bodyText: result.data.bodyText,
    },
  });

  const updatedTicket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: ticketDetailSelect,
  });

  res.json(updatedTicket);
});

ticketsRouter.post("/:id/replies/polish", async (req, res) => {
  const ticketId = parsePositiveIntParam(req.params.id);

  if (!ticketId) {
    res.status(400).json({ error: "工单 ID 无效。" });
    return;
  }

  const result = ticketReplyPolishSchema.safeParse(req.body ?? {});

  if (!result.success) {
    res.status(400).json({ error: getIssueMessage(result.error) });
    return;
  }

  const userId = req.user?.id;
  const agentName = req.user?.name?.trim();

  if (!userId || !agentName) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: ticketDetailSelect,
  });

  if (!ticket) {
    res.status(404).json({ error: "工单不存在。" });
    return;
  }

  try {
    const polishedReply = await polishTicketReply(ticket, result.data.bodyText, agentName);
    res.json(polishedReply);
  } catch (error) {
    console.error("润色回复失败:", error);
    res.status(500).json({ error: "润色回复失败，请稍后再试。" });
  }
});

ticketsRouter.post("/:id/summary", async (req, res) => {
  const ticketId = parsePositiveIntParam(req.params.id);

  if (!ticketId) {
    res.status(400).json({ error: "工单 ID 无效。" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: ticketDetailSelect,
  });

  if (!ticket) {
    res.status(404).json({ error: "工单不存在。" });
    return;
  }

  try {
    const summary = await summarizeTicketThread(ticket);
    res.json(summary);
  } catch (error) {
    console.error("生成工单摘要失败:", error);
    res.status(500).json({ error: "生成摘要失败，请稍后再试。" });
  }
});
