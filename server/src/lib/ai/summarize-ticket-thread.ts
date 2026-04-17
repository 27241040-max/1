import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText } from "ai";
import type { TicketSummaryResult } from "core/email";

import { getRequiredEnv } from "../../config";

type SummarizeTicketThreadContext = {
  bodyText: string;
  customer: {
    email: string;
    id: number;
    name: string;
  };
  replies: Array<{
    author: {
      email: string | null;
      id: string | null;
      name: string | null;
    } | null;
    authorLabel: string;
    bodyText: string;
    createdAt: Date;
    id: number;
    source: "agent" | "ai_auto_resolution";
    updatedAt: Date;
  }>;
  subject: string;
};

function formatReplyHistory(context: SummarizeTicketThreadContext) {
  if (context.replies.length === 0) {
    return "暂无历史回复";
  }

  return context.replies
    .map((reply, index) =>
      [
        `#${index + 1}`,
        `作者: ${reply.authorLabel || reply.author?.name || "System"}${
          reply.author?.email ? ` <${reply.author.email}>` : ""
        }`,
        `时间: ${reply.createdAt.toISOString()}`,
        `内容: ${reply.bodyText}`,
      ].join("\n"),
    )
    .join("\n\n");
}

export async function summarizeTicketThread(
  context: SummarizeTicketThreadContext,
): Promise<TicketSummaryResult> {
  const deepseek = createDeepSeek({
    apiKey: getRequiredEnv("DEEPSEEK_API_KEY"),
  });

  const { text } = await generateText({
    model: deepseek("deepseek-chat"),
    system: [
      "你是客服工单摘要助手。",
      "你必须只根据工单主题、客户原始消息和历史回复生成摘要，不得编造事实。",
      "输出必须使用简体中文。",
      "请输出纯文本，严格使用以下三行格式：",
      "客户诉求：...",
      "当前进展：...",
      "待跟进：...",
      "如果暂无历史回复或暂无明确进展，要明确写出“暂无客服回复”或“待人工确认”。",
      "每一行都要简洁具体，不要使用 Markdown、项目符号或额外解释。",
    ].join("\n"),
    prompt: [
      `工单主题: ${context.subject}`,
      `客户: ${context.customer.name} <${context.customer.email}>`,
      `客户原始消息:\n${context.bodyText}`,
      `历史回复:\n${formatReplyHistory(context)}`,
      "请直接输出摘要。",
    ].join("\n\n"),
  });

  const summaryText = text.trim();

  if (!summaryText) {
    throw new Error("DeepSeek returned an empty response.");
  }

  return {
    bodyText: summaryText,
    generatedAt: new Date().toISOString(),
  };
}
