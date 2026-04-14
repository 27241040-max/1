import type { ComponentProps } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { UserFormDialog } from "./UserFormDialog";

describe("UserFormDialog", () => {
  const onOpenChange = vi.fn();
  const onSubmit = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderDialog(overrides?: Partial<ComponentProps<typeof UserFormDialog>>) {
    return render(
      <UserFormDialog
        isOpen
        isSubmitting={false}
        mode="create"
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        {...overrides}
      />,
    );
  }

  test("renders all form fields in create mode", () => {
    renderDialog();

    expect(screen.getByRole("heading", { name: "创建新用户" })).toBeVisible();
    expect(screen.getByLabelText("姓名")).toBeVisible();
    expect(screen.getByLabelText("电子邮件")).toBeVisible();
    expect(screen.getByLabelText("密码")).toBeVisible();
    expect(screen.getByRole("button", { name: "创建用户" })).toBeVisible();
  });

  test("renders edit mode copy and prefilled values", () => {
    renderDialog({
      initialValues: {
        email: "agent@example.com",
        name: "Agent User",
      },
      mode: "edit",
    });

    expect(screen.getByRole("heading", { name: "编辑用户" })).toBeVisible();
    expect(screen.getByDisplayValue("Agent User")).toBeVisible();
    expect(screen.getByDisplayValue("agent@example.com")).toBeVisible();
    expect(screen.getByText("留空则不修改密码")).toBeVisible();
    expect(screen.getByRole("button", { name: "保存修改" })).toBeVisible();
    expect(screen.getByLabelText("密码")).toHaveValue("");
  });

  test("shows validation messages for invalid input", async () => {
    renderDialog();

    fireEvent.change(screen.getByLabelText("姓名"), { target: { value: "ab" } });
    fireEvent.change(screen.getByLabelText("电子邮件"), { target: { value: "bad-email" } });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "1234567" } });
    fireEvent.click(screen.getByRole("button", { name: "创建用户" }));

    await screen.findByText("名称至少包含 3 个字符");
    expect(screen.getByText("请输入有效的邮箱地址")).toBeVisible();
    expect(screen.getByText("密码至少应为 8 个字符")).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("submits valid create values", async () => {
    renderDialog();

    fireEvent.change(screen.getByLabelText("姓名"), { target: { value: "Created User" } });
    fireEvent.change(screen.getByLabelText("电子邮件"), {
      target: { value: "created@example.com" },
    });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "创建用户" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      email: "created@example.com",
      name: "Created User",
      password: "password123",
    });
  });

  test("submits edit values without password when left blank", async () => {
    renderDialog({
      initialValues: {
        email: "agent@example.com",
        name: "Agent User",
      },
      mode: "edit",
    });

    fireEvent.change(screen.getByLabelText("姓名"), { target: { value: "Updated Agent" } });
    fireEvent.change(screen.getByLabelText("电子邮件"), {
      target: { value: "updated.agent@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      email: "updated.agent@example.com",
      name: "Updated Agent",
      password: undefined,
    });
  });

  test("submits edit values with password when provided", async () => {
    renderDialog({
      initialValues: {
        email: "agent@example.com",
        name: "Agent User",
      },
      mode: "edit",
    });

    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "newpassword123" } });
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      email: "agent@example.com",
      name: "Agent User",
      password: "newpassword123",
    });
  });

  test("calls onOpenChange(false) when cancel is clicked", () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "取消" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("renders server error message when provided", () => {
    renderDialog({ errorMessage: "该邮箱已存在。", mode: "edit" });

    expect(screen.getByText("保存失败")).toBeVisible();
    expect(screen.getByText("该邮箱已存在。")).toBeVisible();
  });
});
