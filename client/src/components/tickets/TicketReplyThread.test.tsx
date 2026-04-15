import type { TicketReply } from "core/email";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { TicketReplyThread } from "./TicketReplyThread";

const replies: TicketReply[] = [
  {
    author: {
      email: "agent@example.com",
      id: "user_1",
      name: "Agent Smith",
    },
    bodyText: "We have reviewed your request and will send a follow-up shortly.",
    createdAt: "2026-04-14T10:00:00.000Z",
    id: 101,
    updatedAt: "2026-04-14T10:00:00.000Z",
  },
  {
    author: {
      email: "taylor.agent@example.com",
      id: "user_2",
      name: "Taylor Agent",
    },
    bodyText: "The issue has been escalated to our billing team.",
    createdAt: "2026-04-14T11:30:00.000Z",
    id: 102,
    updatedAt: "2026-04-14T11:30:00.000Z",
  },
];

describe("TicketReplyThread", () => {
  test("renders empty state when there are no replies", () => {
    render(<TicketReplyThread replies={[]} />);

    expect(screen.getByText("回复线程")).toBeVisible();
    expect(screen.getByText("按时间顺序显示客服回复。")).toBeVisible();
    expect(screen.getByText("暂无回复")).toBeVisible();
  });

  test("renders reply history entries", () => {
    render(<TicketReplyThread replies={replies} />);

    expect(screen.getByText("Agent Smith")).toBeVisible();
    expect(screen.getByText("agent@example.com")).toBeVisible();
    expect(screen.getByText("Taylor Agent")).toBeVisible();
    expect(screen.getByText("taylor.agent@example.com")).toBeVisible();
    expect(
      screen.getByText("We have reviewed your request and will send a follow-up shortly."),
    ).toBeVisible();
    expect(screen.getByText("The issue has been escalated to our billing team.")).toBeVisible();
  });
});
