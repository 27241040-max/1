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
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">AI Helpdesk</p>
          <h1 className="topbar__title">Ticket Operations</h1>
        </div>
        <div className="user-menu">
          <div>
            <span className="user-menu__label">当前用户</span>
            <strong className="user-menu__name">{displayName}</strong>
          </div>
          <button
            className="button button--secondary"
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
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
