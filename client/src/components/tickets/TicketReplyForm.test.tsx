import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { TicketReplyForm } from "./TicketReplyForm";

describe("TicketReplyForm", () => {
  test("submits trimmed reply text and clears the form on success", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<TicketReplyForm isSubmitting={false} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("回复内容"), {
      target: { value: "  Looking into this now. I will update you shortly.  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交回复" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        bodyText: "Looking into this now. I will update you shortly.",
      });
    });
    expect(screen.getByLabelText("回复内容")).toHaveValue("");
  });

  test("shows client-side validation when reply is empty", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<TicketReplyForm isSubmitting={false} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("回复内容"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交回复" }));

    expect(await screen.findByText("回复内容不能为空。")).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("renders server error and keeps input when submit fails", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("boom"));

    const { rerender } = render(<TicketReplyForm isSubmitting={false} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("回复内容"), {
      target: { value: "Still investigating the issue." },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交回复" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        bodyText: "Still investigating the issue.",
      });
    });

    rerender(
      <TicketReplyForm
        errorMessage="提交回复失败，请稍后再试。"
        isSubmitting={false}
        onSubmit={onSubmit}
      />,
    );

    expect(await screen.findByText("提交回复失败，请稍后再试。")).toBeVisible();
    expect(screen.getByLabelText("回复内容")).toHaveValue("Still investigating the issue.");
  });

  test("disables the textarea and button while submitting", () => {
    render(<TicketReplyForm isSubmitting onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("回复内容")).toBeDisabled();
    expect(screen.getByRole("button", { name: "提交中..." })).toBeDisabled();
  });
});
