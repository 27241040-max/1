import type { MailDataRequired } from "@sendgrid/mail";

import { getConfiguredReplyToAddress, getConfiguredSenderAddress, sendTransactionalEmail } from "./sendgrid";

type TicketEmailContext = {
  bodyText: string;
  customer: {
    email: string;
    name: string;
  };
  externalMessageId?: string | null;
  subject: string;
};

const supportBrandName = "Code with MasterHong Support";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeReplySubject(subject: string) {
  const trimmed = subject.trim();

  if (/^re:/i.test(trimmed)) {
    return trimmed;
  }

  return `Re: ${trimmed}`;
}

function buildTicketReplyHtml(bodyText: string) {
  const escapedBody = escapeHtml(bodyText).replace(/\r?\n/g, "<br />");

  return [
    "<!doctype html>",
    '<html lang="en">',
    "  <body style=\"margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;\">",
    '    <div style="margin:0 auto;max-width:640px;padding:32px 20px;">',
    '      <div style="border:1px solid #dbe3f0;border-radius:16px;background:#ffffff;overflow:hidden;">',
    `        <div style="padding:20px 24px;background:#111827;color:#ffffff;font-size:18px;font-weight:700;">${escapeHtml(supportBrandName)}</div>`,
    `        <div style="padding:24px;font-size:15px;line-height:1.7;white-space:normal;">${escapedBody}</div>`,
    "      </div>",
    "    </div>",
    "  </body>",
    "</html>",
  ].join("\n");
}

export function buildTicketReplyEmail(context: TicketEmailContext): MailDataRequired {
  const sender = getConfiguredSenderAddress();
  const replyTo = getConfiguredReplyToAddress();
  const message: MailDataRequired = {
    to: {
      email: context.customer.email,
      name: context.customer.name,
    },
    from: sender,
    replyTo,
    subject: normalizeReplySubject(context.subject),
    text: context.bodyText,
    html: buildTicketReplyHtml(context.bodyText),
  };

  if (context.externalMessageId?.trim()) {
    message.headers = {
      "In-Reply-To": context.externalMessageId.trim(),
      References: context.externalMessageId.trim(),
    };
  }

  return message;
}

export async function sendTicketReplyEmail(context: TicketEmailContext): Promise<void> {
  await sendTransactionalEmail(buildTicketReplyEmail(context));
}
