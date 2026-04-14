import { ticketListQuerySchema, type TicketSortField, type TicketSortOrder } from "core/email";
import { Router } from "express";

import { Prisma } from "../generated/prisma";
import { getIssueMessage } from "../lib/validation";

import { requireAuth } from "../middleware/require-auth";
import { prisma } from "../prisma";

export const ticketsRouter = Router();

ticketsRouter.use(requireAuth);

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

  const sortBy = result.data.sortBy ?? "createdAt";
  const sortOrder = result.data.sortOrder ?? "desc";
  const tickets = await prisma.ticket.findMany({
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
  });

  res.json({ tickets });
});
