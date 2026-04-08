import { useQuery } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";

type HealthResponse = {
  service: string;
  status: string;
};

export function Homepage() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const response = await apiClient.get<HealthResponse>("/api/health");
      return response.data;
    },
  });

  if (isError) {
    console.error("健康检查失败:", error);
  }

  const healthTone: "ok" | "error" = isError ? "error" : "ok";
  const healthStatus = isPending
    ? "正在检查服务器状态..."
    : isError
      ? "无法连接到后端服务器，请检查服务端是否运行。"
      : `服务正常运行 (${data.service}: ${data.status.toUpperCase()})`;

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <article className="min-h-80 rounded-[28px] border border-border bg-card p-8 shadow-sm">
        <p className="m-0 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Protected Home
        </p>
        <h2 className="mt-3 text-[clamp(2rem,3vw,3rem)] font-semibold leading-none tracking-[-0.04em] text-card-foreground">
          AI Helpdesk 主控台
        </h2>
        <p className="mt-5 max-w-[34rem] text-[1.05rem] leading-7 text-muted-foreground">
          这里将承载工单看板、知识库与运营指标。当前页面已接入真实登录态，并限制为登录用户访问。
        </p>
      </article>

      <article
        className={`grid min-h-80 content-between gap-4 rounded-[28px] border p-7 shadow-sm ${
          healthTone === "ok"
            ? "border-border bg-card"
            : "border-destructive/40 bg-destructive/10"
        }`}
      >
        <span className="text-[0.92rem] uppercase tracking-[0.12em] text-muted-foreground">
          API 连接状态检查
        </span>
        <strong className="text-[1.3rem] leading-7 text-card-foreground">{healthStatus}</strong>
      </article>
    </section>
  );
}
