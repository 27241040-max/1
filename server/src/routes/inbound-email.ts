import {
  TicketCategory as CoreTicketCategory,
  inboundEmailSchema,
  type InboundEmailInput,
} from "core/email";
import formidableMiddleware from "express-formidable";
import { Router, type NextFunction, type Request, type Response } from "express";
import Parse = require("@sendgrid/inbound-mail-parser");

import { getOptionalEnv } from "../config";
import { getAiAgentUserOrThrow } from "../lib/ai-agent";
import { TicketCategory, TicketStatus } from "../generated/prisma";
import { queueTicketAutoClassification } from "../jobs/boss";
import { getIssueMessage } from "../lib/validation";
import { prisma } from "../prisma";

export const inboundEmailRouter = Router();
const inboundEmailSecret = getOptionalEnv("INBOUND_EMAIL_SECRET");
const sendgridMultipartParser = formidableMiddleware({
  encoding: "utf-8",
  multiples: true,
});

type SendgridInboundPayload = {
  category?: string;
  from?: string;
  headers?: string;
  html?: string;
  subject?: string;
  text?: string;
};

function parseSendgridMultipart(req: Request, res: Response, next: NextFunction) {
  const contentType = req.headers["content-type"] ?? "";

  if (contentType.includes("multipart/form-data")) {
    sendgridMultipartParser(req, res, next);
    return;
  }

  next();
}

function normalizeCategory(category: InboundEmailInput["category"]) {
  if (!category) {
    return undefined;
  }

  switch (category) {
    case "general":
      return TicketCategory.general;
    case "technical":
      return TicketCategory.technical;
    case "refund_request":
      return TicketCategory.refund_request;
  }
}

function normalizeHtmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function parseInboundFromAddress(from: string) {
  const trimmed = from.trim();
  const match = trimmed.match(/^(?:"?([^"]*?)"?\s*)?<([^<>]+)>$/);

  if (match) {
    const email = match[2].trim().toLowerCase();
    const fallbackName = email.split("@")[0] || email;

    return {
      email,
      name: match[1]?.trim() || fallbackName,
    };
  }

  const normalizedEmail = trimmed.toLowerCase();
  const fallbackName = normalizedEmail.split("@")[0] || normalizedEmail;
  return {
    email: normalizedEmail,
    name: fallbackName,
  };
}

function extractMessageId(headers: string | undefined) {
  if (!headers) {
    return undefined;
  }

  const match = headers.match(/^message-id:\s*(.+)$/im);
  return match?.[1]?.trim();
}

function normalizeSendgridPayload(payload: SendgridInboundPayload): InboundEmailInput {
  const from = payload.from ? parseInboundFromAddress(payload.from) : undefined;

  return {
    category:
      payload.category === "general"
        ? CoreTicketCategory.general
        : payload.category === "technical"
          ? CoreTicketCategory.technical
          : payload.category === "refund_request"
            ? CoreTicketCategory.refundRequest
            : undefined,
    from: from ?? {
      email: "",
      name: "",
    },
    messageId: extractMessageId(payload.headers),
    subject: payload.subject?.trim() ?? "",
    text: payload.text?.trim() || (payload.html ? normalizeHtmlToText(payload.html) : ""),
  };
}

function normalizeUploadedFiles(files: Request["files"]) {
  if (!files) {
    return [];
  }

  return Object.values(files).flatMap((file) => {
    if (!file) {
      return [];
    }

    return Array.isArray(file) ? file : [file];
  });
}

function getInboundRequestPayload(req: Request): unknown {
  if ((req.headers["content-type"] ?? "").includes("multipart/form-data")) {
    const parser = new Parse(
      {
        keys: ["category", "from", "headers", "html", "subject", "text"],
      },
      {
        body: req.fields ?? {},
        files: normalizeUploadedFiles(req.files),
      },
    );

    return normalizeSendgridPayload(parser.keyValues() as SendgridInboundPayload);
  }

  return req.body ?? {};
}

inboundEmailRouter.post("/", parseSendgridMultipart, async (req, res) => {
  if (!inboundEmailSecret) {
    res.status(500).json({ error: "Inbound email secret is not configured." });
    return;
  }

  const providedSecret =
    req.header("x-inbound-email-secret")?.trim() ??
    (typeof req.query.secret === "string" ? req.query.secret.trim() : undefined);

  if (!providedSecret || providedSecret !== inboundEmailSecret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const result = inboundEmailSchema.safeParse(getInboundRequestPayload(req));

  if (!result.success) {
    res.status(400).json({ error: getIssueMessage(result.error) });
    return;
  }

  const messageId = result.data.messageId?.trim();

  if (messageId) {
    const existing = await prisma.ticket.findUnique({
      where: {
        externalMessageId: messageId,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      res.json({ created: false, ticketId: existing.id });
      return;
    }
  }

  const email = result.data.from.email.toLowerCase();
  const existingCustomer = await prisma.customer.findUnique({
    where: {
      email,
    },
  });
  const customer = existingCustomer
    ? existingCustomer.name === result.data.from.name
      ? existingCustomer
      : await prisma.customer.update({
          where: {
            id: existingCustomer.id,
          },
          data: {
            name: result.data.from.name,
          },
        })
    : await prisma.customer.create({
        data: {
          email,
          name: result.data.from.name,
        },
      });
  const aiAgent = await getAiAgentUserOrThrow();

  const ticket = await prisma.ticket.create({
    data: {
      assignedUserId: aiAgent.id,
      bodyText: result.data.text,
      category: normalizeCategory(result.data.category),
      customerId: customer.id,
      externalMessageId: messageId,
      source: "email",
      status: TicketStatus.new,
      subject: result.data.subject,
    },
    select: {
      id: true,
      category: true,
    },
  });

  res.status(201).json({ created: true, ticketId: ticket.id });

  queueTicketAutoClassification(ticket.id);
});
