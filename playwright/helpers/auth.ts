import { expect, type Page } from "@playwright/test";

import { ensureCredentialUser } from "./users";

export async function openLoginPage(page: Page) {
  await page.goto("/login");
}

export async function fillLoginForm(page: Page, email: string, password: string) {
  await page.getByLabel("邮箱").fill(email);
  await page.getByLabel("密码").fill(password);
}

export async function submitLoginForm(page: Page) {
  await page.getByRole("button", { name: "登录并进入主页" }).click();
}

export async function signIn(page: Page, email: string, password: string) {
  await openLoginPage(page);
  await fillLoginForm(page, email, password);
  await submitLoginForm(page);
}

export async function expectLoginPage(page: Page) {
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel("邮箱")).toBeVisible();
  await expect(page.getByLabel("密码")).toBeVisible();
  await expect(page.getByRole("button", { name: "登录并进入主页" })).toBeVisible();
}

export async function expectHomePage(page: Page, options?: { isAdmin?: boolean }) {
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "AI Helpdesk 主控台" })).toBeVisible();
  await expect(page.getByText("当前用户")).toBeVisible();

  if (options?.isAdmin) {
    await expect(page.getByRole("link", { name: "用户" })).toBeVisible();
    return;
  }

  await expect(page.getByRole("link", { name: "用户" })).toHaveCount(0);
}

export async function openUsersPage(page: Page) {
  await page.goto("/users");
}

export async function expectUsersPage(page: Page) {
  await expect(page).toHaveURL(/\/users$/);
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: "退出" }).click();
}

export async function signInAsAdmin(page: Page) {
  await ensureCredentialUser({
    email: "admin@example.com",
    password: "qwerdf66",
    name: "Administrator",
    role: "admin",
  });

  await signIn(page, "admin@example.com", "qwerdf66");
  await expectHomePage(page, { isAdmin: true });
}

export async function signInAsAgent(page: Page) {
  await ensureCredentialUser({
    email: "agent@example.com",
    password: "qwerdf66",
    name: "Agent User",
    role: "agent",
  });

  await signIn(page, "agent@example.com", "qwerdf66");
  await expectHomePage(page);
}
