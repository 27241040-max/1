import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";

import { authClient } from "../lib/auth-client";

export function LoginPages() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isPending && session) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message || "登录失败，请检查邮箱和密码。");
      return;
    }

    navigate("/", { replace: true });
  };

  if (isPending) {
    return (
      <main className="shell shell--centered">
        <div className="panel panel--loading">
          <p className="eyebrow">Loading</p>
          <h1>正在检查现有登录状态</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="shell shell--centered">
      <section className="auth-layout">
        <div className="auth-copy">
          <p className="eyebrow">Secure Access</p>
          <h1>登录 AI 工单后台</h1>
          <p className="auth-copy__text">
            使用已有账号进入受保护主页。系统会在成功登录后直接跳转到首页，并在导航栏展示当前用户名。
          </p>
          <div className="auth-copy__hint">
            <span className="auth-copy__hint-title">受保护行为</span>
            <span>未登录访问主页时会自动跳转到登录页。</span>
          </div>
        </div>

        <div className="panel auth-card">
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form__header">
              <p className="eyebrow">Welcome Back</p>
              <h2>邮箱密码登录</h2>
              <p className="muted">
                当前路径：<code>{location.pathname}</code>
              </p>
            </div>

            <label className="field">
              <span>邮箱</span>
              <input
                autoComplete="email"
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                placeholder="admin@example.com"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="field">
              <span>密码</span>
              <input
                autoComplete="current-password"
                onChange={(event) => {
                  setPassword(event.target.value);
                }}
                placeholder="请输入密码"
                required
                type="password"
                value={password}
              />
            </label>

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

            <button className="button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "登录中..." : "登录并进入主页"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
