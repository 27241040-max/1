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
    <section className="dashboard-grid">
      <article className="hero-card">
        <p className="eyebrow">Protected Home</p>
        <h2>AI Helpdesk 主控台</h2>
        <p className="hero-card__text">
          这里将承载工单看板、知识库与运营指标。当前页面已接入真实登录态，并限制为登录用户访问。
        </p>
      </article>

      <article className={`status-card status-card--${healthTone}`}>
        <span className="status-card__title">API 连接状态检查</span>
        <strong>{healthStatus}</strong>
      </article>
    </section>
  );
}
