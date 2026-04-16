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
      email: string;
      id: string;
      name: string;
    };
    bodyText: string;
    createdAt: Date;
    id: number;
    updatedAt: Date;
  }>;
  subject: string;
};

const polishReplySignatureEmail = "dinglinqi07@gmail.com";
const polishReplyClosingLine = "祝好，";

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
      return [
        `#${index + 1}`,
        `作者: ${reply.author.name} <${reply.author.email}>`,
        `时间: ${reply.createdAt.toISOString()}`,
        `内容: ${reply.bodyText}`,
      ].join("\n");
    })
    .join("\n\n");
}

function appendSignature(bodyText: string, agentName: string) {
  const trimmedBodyText = bodyText.trim().replace(/\s+$/, "");

  return `${trimmedBodyText}\n\n${polishReplyClosingLine}\n${agentName}\n\n${polishReplySignatureEmail}`;
}

function removeTrailingSignature(bodyText: string, agentName: string) {
  const normalizedAgentName = agentName.trim();
  const normalizedBodyText = bodyText.trim();
  const signaturePatterns = [
    new RegExp(
      `\\n*${escapeRegExp(polishReplyClosingLine)}\\s*\\n\\s*${escapeRegExp(normalizedAgentName)}\\s*\\n\\s*${escapeRegExp(polishReplySignatureEmail)}\\s*$`,
    ),
    new RegExp(
      `\\n*${escapeRegExp(polishReplyClosingLine)}\\s*\\n\\s*/\\s*${escapeRegExp(normalizedAgentName)}\\s*\\n\\s*/\\s*${escapeRegExp(polishReplySignatureEmail)}\\s*$`,
    ),
  ];

  return signaturePatterns.reduce((result, pattern) => result.replace(pattern, "").trim(), normalizedBodyText);
}

export async function polishTicketReply(
  context: PolishTicketReplyContext,
  draftReply: string,
  agentName: string,
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
      "输出纯文本，不要使用 Markdown、标题、称呼模板、项目符号或解释。",
      "润色正文后，请以以下固定中文邮件签名结尾，并严格使用换行，不要在行首添加 /：",
      polishReplyClosingLine,
      agentName,
      polishReplySignatureEmail,
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
    bodyText: appendSignature(removeTrailingSignature(polishedReply, agentName), agentName),
  };
}
