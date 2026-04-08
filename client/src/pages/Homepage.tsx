import { useEffect, useState } from "react";

import { createApiUrl } from "../lib/api";

type HealthResponse = {
  service: string;
  status: string;
};

export function Homepage() {
  const [healthStatus, setHealthStatus] = useState("正在检查服务器状态...");
  const [healthTone, setHealthTone] = useState<"ok" | "error">("ok");

  useEffect(() => {
    let isMounted = true;

    fetch(createApiUrl("/api/health"), {
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Health check failed with ${response.status}`);
        }

        return (await response.json()) as HealthResponse;
      })
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setHealthTone("ok");
        setHealthStatus(`服务正常运行 (${data.service}: ${data.status.toUpperCase()})`);
      })
      .catch((error: unknown) => {
        console.error("健康检查失败:", error);

        if (!isMounted) {
          return;
        }

        setHealthTone("error");
        setHealthStatus("无法连接到后端服务器，请检查服务端是否运行。");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <article className="min-h-80 rounded-[28px] border border-[rgba(30,62,46,0.12)] bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(245,251,247,0.82))] p-8 shadow-[0_16px_35px_rgba(20,40,33,0.1)] backdrop-blur-xl">
        <p className="m-0 text-xs uppercase tracking-[0.16em] text-slate-500">
          Protected Home
        </p>
        <h2 className="mt-3 text-[clamp(2rem,3vw,3rem)] font-semibold leading-none tracking-[-0.04em] text-slate-900">
          AI Helpdesk 主控台
        </h2>
        <p className="mt-5 max-w-[34rem] text-[1.05rem] leading-7 text-slate-600">
          这里将承载工单看板、知识库与运营指标。当前页面已接入真实登录态，并限制为登录用户访问。
        </p>
      </article>

      <article
        className={`grid min-h-80 content-between gap-4 rounded-[28px] border border-[rgba(30,62,46,0.12)] p-7 shadow-[0_16px_35px_rgba(20,40,33,0.1)] backdrop-blur-xl ${
          healthTone === "ok"
            ? "bg-[linear-gradient(180deg,rgba(232,245,237,0.95),rgba(255,255,255,0.82))]"
            : "bg-[linear-gradient(180deg,rgba(254,236,232,0.95),rgba(255,255,255,0.82))]"
        }`}
      >
        <span className="text-[0.92rem] uppercase tracking-[0.12em] text-slate-500">
          API 连接状态检查
        </span>
        <strong className="text-[1.3rem] leading-7 text-slate-900">{healthStatus}</strong>
      </article>
    </section>
  );
}
