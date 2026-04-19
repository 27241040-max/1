import sgMail, { type MailDataRequired } from "@sendgrid/mail";

import { getOptionalEnv, getRequiredEnv } from "../config";

const defaultDeliveryErrorMessage = "邮件发送失败，请稍后再试。";

type EmailAddress = {
  email: string;
  name?: string;
};

export class TicketEmailDeliveryError extends Error {
  readonly userMessage: string;

  constructor(message = "SendGrid delivery failed.", userMessage = defaultDeliveryErrorMessage) {
    super(message);
    this.name = "TicketEmailDeliveryError";
    this.userMessage = userMessage;
  }
}

let isConfigured = false;

function ensureSendGridConfigured() {
  if (isConfigured) {
    return;
  }

  sgMail.setApiKey(getRequiredEnv("SENDGRID_API_KEY"));
  isConfigured = true;
}

export function getTicketEmailDeliveryErrorMessage(error: unknown): string {
  if (error instanceof TicketEmailDeliveryError) {
    return error.userMessage;
  }

  return defaultDeliveryErrorMessage;
}

export function getConfiguredSenderAddress(): EmailAddress {
  return {
    email: getRequiredEnv("SENDGRID_FROM_EMAIL"),
    name: getRequiredEnv("SENDGRID_FROM_NAME"),
  };
}

export function getConfiguredReplyToAddress(): EmailAddress {
  return {
    email: getOptionalEnv("SENDGRID_REPLY_TO_EMAIL") ?? getRequiredEnv("SENDGRID_FROM_EMAIL"),
    name: getOptionalEnv("SENDGRID_REPLY_TO_NAME") ?? getRequiredEnv("SENDGRID_FROM_NAME"),
  };
}

export async function sendTransactionalEmail(message: MailDataRequired): Promise<void> {
  ensureSendGridConfigured();

  try {
    await sgMail.send(message);
  } catch (error) {
    console.error("SendGrid 邮件发送失败:", error);

    if (typeof error === "object" && error !== null && "response" in error) {
      console.error("SendGrid 响应:", (error as { response?: unknown }).response);
    }

    throw new TicketEmailDeliveryError();
  }
}
