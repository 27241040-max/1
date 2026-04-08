import { expect, test } from "@playwright/test";

import {
  expectHomePage,
  expectLoginPage,
  expectUsersPage,
  fillLoginForm,
  openLoginPage,
  openUsersPage,
  signInAsAdmin,
  signInAsAgent,
  signOut,
  submitLoginForm,
} from "../helpers/auth";

test("unauthenticated visit to / redirects to /login", async ({ page }) => {
  await page.goto("/");

  await expectLoginPage(page);
});

test("unauthenticated visit to /users redirects to /login", async ({ page }) => {
  await openUsersPage(page);

  await expectLoginPage(page);
});

test("login page renders expected fields and submit affordance", async ({ page }) => {
  await openLoginPage(page);
  await expectLoginPage(page);
});

test("client-side validation shows empty-field errors", async ({ page }) => {
  await openLoginPage(page);
  await submitLoginForm(page);

  await expect(page.getByText("请输入邮箱")).toBeVisible();
  await expect(page.getByText("请输入密码")).toBeVisible();
});

test("client-side validation shows invalid email and short password errors", async ({ page }) => {
  await openLoginPage(page);
  await fillLoginForm(page, "invalid-email", "123");
  await submitLoginForm(page);

  await expect(page.getByText("请输入有效的邮箱地址")).toBeVisible();
  await expect(page.getByText("密码至少需要 6 个字符")).toBeVisible();
});

test("invalid credentials show a friendly error and keep the user on login", async ({ page }) => {
  await openLoginPage(page);
  await fillLoginForm(page, "admin@example.com", "wrong-password");
  await submitLoginForm(page);

  await expectLoginPage(page);
  await expect(page.getByRole("alert")).toContainText("邮箱或密码错误。");
});

test("admin login succeeds and lands on the protected app", async ({ page }) => {
  await signInAsAdmin(page);
});

test("authenticated users are redirected away from /login", async ({ page }) => {
  await signInAsAdmin(page);

  await openLoginPage(page);
  await expectHomePage(page, { isAdmin: true });
});

test("protected route access remains available after login", async ({ page }) => {
  await signInAsAdmin(page);

  await page.goto("/");
  await expectHomePage(page, { isAdmin: true });
});

test("admin can navigate to /users and see the Users heading", async ({ page }) => {
  await signInAsAdmin(page);

  await page.getByRole("link", { name: "用户" }).click();
  await expectUsersPage(page);
});

test("non-admin users are redirected away from /users", async ({ page }) => {
  await signInAsAgent(page);

  await openUsersPage(page);
  await expectHomePage(page);
});

test("session persists across page reload", async ({ page }) => {
  await signInAsAdmin(page);

  await page.reload();
  await expectHomePage(page, { isAdmin: true });
});

test("sign-out returns the user to /login", async ({ page }) => {
  await signInAsAdmin(page);

  await signOut(page);
  await expectLoginPage(page);

  await page.goto("/");
  await expectLoginPage(page);
});
