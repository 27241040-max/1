import type { ZodError } from "zod";

export function getIssueMessage(error: ZodError, fallback = "请求数据不合法。") {
  return error.issues[0]?.message ?? fallback;
}
