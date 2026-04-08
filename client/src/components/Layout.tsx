import { useState } from "react";
import { Outlet, useNavigate } from "react-router";

import { authClient } from "../lib/auth-client";

type LayoutProps = {
  displayName: string;
};

export function Layout({ displayName }: LayoutProps) {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    const { error } = await authClient.signOut();
    setIsSigningOut(false);

    if (!error) {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4efe7] text-slate-700">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(53,135,102,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(208,111,64,0.12),transparent_28%)]"
      />
      <div className="relative grid min-h-screen gap-6 p-4 md:p-6">
        <header className="flex flex-col gap-5 rounded-3xl border border-[rgba(30,62,46,0.12)] bg-[rgba(255,252,247,0.86)] px-5 py-5 shadow-[0_16px_35px_rgba(20,40,33,0.1)] backdrop-blur-xl md:flex-row md:items-center md:justify-between md:px-7">
          <div>
            <p className="m-0 text-xs uppercase tracking-[0.16em] text-slate-500">
              AI Helpdesk
            </p>
            <h1 className="mt-1 text-[clamp(1.8rem,2vw,2.3rem)] font-semibold tracking-[-0.04em] text-slate-900">
              Ticket Operations
            </h1>
          </div>
          <div className="flex items-start gap-4 rounded-2xl border border-[rgba(30,62,46,0.12)] bg-[rgba(255,255,255,0.6)] px-4 py-3 md:items-center">
            <div>
              <span className="block text-xs uppercase tracking-[0.16em] text-slate-500">
                当前用户
              </span>
              <strong className="mt-1 block text-slate-900">{displayName}</strong>
            </div>
            <button
              className="rounded-full border border-[rgba(15,61,62,0.18)] bg-[rgba(255,255,255,0.84)] px-5 py-3 font-semibold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
              disabled={isSigningOut}
              onClick={() => {
                void handleSignOut();
              }}
              type="button"
            >
              {isSigningOut ? "退出中..." : "退出"}
            </button>
          </div>
        </header>
        <main className="grid">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
