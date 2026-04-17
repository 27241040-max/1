import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText } from "ai";
import type { TicketReplyPolishResult } from "core/email";

import { getRequiredEnv } from "../../config";

type PolishTicketReplyContext = {
  assignedUser: {
    email: string;
    id: string;
    name: string;
  } | null;
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

const replySignatureName = "Code with MasterHong Support";

function getCustomerFirstName(fullName: string) {
  const normalizedName = fullName.trim().replace(/\s+/g, " ");

  if (!normalizedName) {
    return "there";
  }

  return normalizedName.split(" ")[0] ?? normalizedName;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatReplyHistory(context: PolishTicketReplyContext) {
  if (context.replies.length === 0) {
    return "暂无历史回复";
  }

  return context.replies
    .map((reply, index) => {
      const authorName = reply.authorLabel || reply.author?.name || "System";
      const authorEmail = reply.author?.email ? ` <${reply.author.email}>` : "";

      return [
        `#${index + 1}`,
        `作者: ${authorName}${authorEmail}`,
        `时间: ${reply.createdAt.toISOString()}`,
        `内容: ${reply.bodyText}`,
      ].join("\n");
    })
    .join("\n\n");
}

function appendSignature(bodyText: string) {
  const trimmedBodyText = bodyText.trim().replace(/\s+$/, "");

  return `${trimmedBodyText}\n\n${replySignatureName}`;
}

function removeTrailingSignature(bodyText: string) {
  const normalizedBodyText = bodyText.trim();
  const signaturePatterns = [
    /\n*\s*Best regards,\s*\n\s*Code with MasterHong Support\s*$/i,
    /\n*\s*Kind regards,\s*\n\s*Code with MasterHong Support\s*$/i,
    /\n*\s*祝好，\s*\n\s*.+?\s*\n\s*.+?\s*$/s,
    /\n*\s*Code with MasterHong Support\s*$/i,
  ];

  return signaturePatterns.reduce((result, pattern) => result.replace(pattern, "").trim(), normalizedBodyText);
}

export async function polishTicketReply(
  context: PolishTicketReplyContext,
  draftReply: string,
  _agentName: string,
): Promise<TicketReplyPolishResult> {
  const customerFirstName = getCustomerFirstName(context.customer.name);
  const deepseek = createDeepSeek({
    apiKey: getRequiredEnv("DEEPSEEK_API_KEY"),
  });

  const { text } = await generateText({
    model: deepseek("deepseek-chat"),
    system: [
      "你是资深客服专员的写作助手，只负责润色客服草稿，不替客服新增未经确认的承诺、政策、金额、时效或事实。",
      "你必须结合工单主题、客户原始消息、历史回复和当前草稿进行润色。",
      "保持当前草稿的原意、事实和行动承诺不变，只优化表达、条理、礼貌度、专业度和清晰度。",
      "无论当前草稿是什么语言，最终回复必须使用简体中文。",
      `回复开头必须称呼客户，并且只使用客户 first name：${customerFirstName}。不要使用客户的姓氏、全名、邮箱或泛化称呼。`,
      "输出纯文本，不要使用 Markdown、标题、项目符号或解释。",
      "请使用规范邮件格式：称呼、正文、结尾署名。",
      `邮件结尾必须仅以以下署名单独成行结尾：${replySignatureName}`,
      "回复语气必须专业、友好、清晰。",
    ].join("\n"),
    prompt: [
      `工单主题: ${context.subject}`,
      `客户: ${context.customer.name} <${context.customer.email}>`,
      `客户 first name: ${customerFirstName}`,
      `当前负责人: ${
        context.assignedUser
          ? `${context.assignedUser.name} <${context.assignedUser.email}>`
          : "未指派"
      }`,
      `客户原始消息:\n${context.bodyText}`,
      `历史回复:\n${formatReplyHistory(context)}`,
      `当前草稿:\n${draftReply}`,
      "请直接输出润色后的最终回复文本，正文使用简体中文。",
    ].join("\n\n"),
  });

  const polishedReply = text.trim();

  if (!polishedReply) {
    throw new Error("DeepSeek returned an empty response.");
  }

  return {
    bodyText: appendSignature(removeTrailingSignature(polishedReply)),
  };
}
