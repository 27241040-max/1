import { readFile } from "node:fs/promises";
import path from "node:path";

import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText, Output } from "ai";
import { z } from "zod";

import { getRequiredEnv } from "../../config";
import { TicketCategory } from "../../generated/prisma";

type ResolveTicketWithKnowledgeBaseContext = {
  bodyText: string;
  customer: {
    email: string;
    id: number;
    name: string;
  };
  subject: string;
};

const knowledgeBaseFilePath = path.resolve(__dirname, "../../../.knowledge-base.md");

const knowledgeBaseResolutionSchema = z.object({
  category: z.nativeEnum(TicketCategory),
  replyBodyText: z.string().nullable(),
  shouldResolve: z.boolean(),
});

function getCustomerFirstName(fullName: string) {
  const normalizedName = fullName.trim().replace(/\s+/g, " ");

  if (!normalizedName) {
    return "there";
  }

  return normalizedName.split(" ")[0] ?? normalizedName;
}

export async function readKnowledgeBaseMarkdown() {
  const knowledgeBaseMarkdown = (await readFile(knowledgeBaseFilePath, "utf8")).trim();

  if (!knowledgeBaseMarkdown) {
    throw new Error("Knowledge base file is empty.");
  }

  return knowledgeBaseMarkdown;
}

export async function resolveTicketWithKnowledgeBase(
  context: ResolveTicketWithKnowledgeBaseContext,
  knowledgeBaseMarkdown: string,
) {
  const customerFirstName = getCustomerFirstName(context.customer.name);
  const deepseek = createDeepSeek({
    apiKey: getRequiredEnv("DEEPSEEK_API_KEY"),
  });

  const { output } = await generateText({
    model: deepseek("deepseek-chat"),
    output: Output.object({
      schema: knowledgeBaseResolutionSchema,
    }),
    system: [
      "你是客服工单自动分流与自动解决助手。",
      "你必须同时完成两件事：一是为工单分类；二是判断这张工单能否仅依据知识库内容被自动解决。",
      "分类字段 category 的值只能是 general、technical、refund_request。",
      "replyBodyText 必须是最终给客户的完整回复正文；如果不能自动解决，则 replyBodyText 必须为 null。",
      "shouldResolve 只有在知识库足以明确回答客户问题时才能为 true。",
      "你只能依据提供的知识库内容作答，不得编造政策、权限、流程、时效、价格、产品能力或例外规则。",
      "如果知识库不足以明确回答、问题属于个案、需要人工核实、需要技术排障、需要审批或存在歧义，必须返回 shouldResolve = false。",
      "即使不能自动解决，也必须根据用户问题返回最合适的 category。",
      "最终回复语言应与客户原始消息保持一致；如果无法判断，则使用简体中文。",
      `如果 shouldResolve = true，replyBodyText 必须以客户名字称呼对方，并且只使用客户名字：${customerFirstName}。`,
      "如果 shouldResolve = true，replyBodyText 必须使用规范邮件格式，语气专业、友好、清晰。",
      "如果 shouldResolve = true，replyBodyText 必须仅以以下署名单独成行结尾：Code with MasterHong Support。",
      "输出必须是严格 JSON。",
      "知识库内容如下：",
      knowledgeBaseMarkdown,
    ].join("\n\n"),
    prompt: [
      `工单主题: ${context.subject}`,
      `客户: ${context.customer.name} <${context.customer.email}>`,
      `客户名字: ${customerFirstName}`,
      `客户原始消息:\n${context.bodyText}`,
      "请返回 category、shouldResolve、replyBodyText。",
    ].join("\n\n"),
  });

  if (!output) {
    throw new Error("DeepSeek returned an empty knowledge-base resolution result.");
  }

  const replyBodyText = output.replyBodyText?.trim() ?? null;
  const shouldResolve = output.shouldResolve && Boolean(replyBodyText);

  return {
    category: output.category,
    replyBodyText: shouldResolve ? replyBodyText : null,
    shouldResolve,
  };
}
