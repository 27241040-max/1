import { Navigate } from "react-router";

import { authClient } from "../lib/auth-client";
import { Layout } from "./Layout";

export function ProtectionRount() {
  const { data: session, isPending, error } = authClient.useSession();

  if (isPending) {
    return (
      <main className="shell shell--centered">
        <div className="panel panel--loading">
          <p className="eyebrow">Authenticating</p>
          <h1>正在验证登录状态</h1>
          <p className="muted">请稍候，系统正在同步你的会话信息。</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="shell shell--centered">
        <div className="panel panel--error">
          <p className="eyebrow">Session Error</p>
          <h1>会话读取失败</h1>
          <p className="muted">{error.message}</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const displayName = session.user.name?.trim() || session.user.email;

  return <Layout displayName={displayName} />;
}
