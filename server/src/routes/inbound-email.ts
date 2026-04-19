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

const fallbackInboundSubject = "（无主题）";

function extractHeaderValues(headers: string | undefined, headerName: string) {
  if (!headers) {
    return [];
  }

  return headers
    .split(/\r?\n/)
    .flatMap((line) => {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex < 0) {
        return [];
      }

      const name = line.slice(0, separatorIndex).trim().toLowerCase();

      if (name !== headerName.toLowerCase()) {
        return [];
      }

      return [line.slice(separatorIndex + 1).trim()];
    })
    .filter(Boolean);
}

function extractMessageIdTokens(value: string | undefined) {
  if (!value) {
    return [];
  }

  const matches = value.match(/<[^>]+>/g);

  if (matches && matches.length > 0) {
    return matches.map((match) => match.trim()).filter(Boolean);
  }

  return value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

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
  return extractHeaderValues(headers, "message-id")[0]?.trim();
}

function extractThreadMessageIds(headers: string | undefined) {
  const inReplyTo = extractHeaderValues(headers, "in-reply-to").flatMap(extractMessageIdTokens);
  const references = extractHeaderValues(headers, "references").flatMap(extractMessageIdTokens);

  return Array.from(new Set([...inReplyTo, ...references]));
}

function normalizeInboundSubject(subject: string | undefined) {
  const normalizedSubject = subject?.trim();
  return normalizedSubject ? normalizedSubject : fallbackInboundSubject;
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
    headers: payload.headers,
    messageId: extractMessageId(payload.headers),
    subject: normalizeInboundSubject(payload.subject),
    text: payload.text?.trim() || (payload.html ? normalizeHtmlToText(payload.html) : ""),
  } as InboundEmailInput;
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

  if (
    req.body &&
    typeof req.body === "object" &&
    !Array.isArray(req.body) &&
    "subject" in req.body &&
    typeof req.body.subject === "string"
  ) {
    return {
      ...req.body,
      subject: normalizeInboundSubject(req.body.subject),
    };
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

  const inboundRequestPayload = getInboundRequestPayload(req);
  const result = inboundEmailSchema.safeParse(inboundRequestPayload);

  if (!result.success) {
    res.status(400).json({ error: getIssueMessage(result.error) });
    return;
  }

  const messageId = result.data.messageId?.trim();
  const threadMessageIds =
    inboundRequestPayload &&
    typeof inboundRequestPayload === "object" &&
    !Array.isArray(inboundRequestPayload) &&
    "headers" in inboundRequestPayload &&
    typeof inboundRequestPayload.headers === "string"
      ? extractThreadMessageIds(inboundRequestPayload.headers)
      : [];

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

  if (threadMessageIds.length > 0) {
    const existingThreadTicket = await prisma.ticket.findFirst({
      where: {
        externalMessageId: {
          in: threadMessageIds,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (existingThreadTicket) {
      await prisma.ticket.update({
        where: {
          id: existingThreadTicket.id,
        },
        data: {
          replies: {
            create: {
              authorLabel: customer.name,
              bodyText: result.data.text,
              source: "agent",
            },
          },
          ...(existingThreadTicket.status === TicketStatus.closed ||
          existingThreadTicket.status === TicketStatus.resolved
            ? {
                resolvedAt: null,
                status: TicketStatus.open,
              }
            : {}),
        },
        select: {
          id: true,
        },
      });

      res.json({ created: false, ticketId: existingThreadTicket.id, threaded: true });
      return;
    }
  }
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
