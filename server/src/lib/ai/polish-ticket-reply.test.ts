import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  generateTextMock,
  deepseekModelFactoryMock,
  createDeepSeekMock,
  getRequiredEnvMock,
} = vi.hoisted(() => {
  const deepseekModelFactoryMock = vi.fn();

  return {
    generateTextMock: vi.fn(),
    deepseekModelFactoryMock,
    createDeepSeekMock: vi.fn(() => deepseekModelFactoryMock),
    getRequiredEnvMock: vi.fn(),
  };
});

vi.mock("ai", () => ({
  generateText: generateTextMock,
}));

vi.mock("@ai-sdk/deepseek", () => ({
  createDeepSeek: createDeepSeekMock,
}));

vi.mock("../../config", () => ({
  getRequiredEnv: getRequiredEnvMock,
}));

import { polishTicketReply } from "./polish-ticket-reply";

const ticketContext = {
  assignedUser: {
    email: "admin@example.com",
    id: "user_1",
    name: "Administrator",
  },
  bodyText: "客户想知道退款什么时候到账。",
  customer: {
    email: "taylor@example.com",
    id: 1,
    name: "Taylor Swift",
  },
  replies: [
    {
      author: {
        email: "agent@example.com",
        id: "user_2",
        name: "Agent Smith",
      },
      bodyText: "我们正在核实退款状态。",
      createdAt: new Date("2026-04-14T10:00:00.000Z"),
      id: 101,
      updatedAt: new Date("2026-04-14T10:00:00.000Z"),
    },
  ],
  subject: "Refund request follow-up",
};

describe("polishTicketReply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRequiredEnvMock.mockReturnValue("deepseek-test-key");
    deepseekModelFactoryMock.mockReturnValue("deepseek-model");
  });

  test("passes Chinese and first-name constraints to the model", async () => {
    generateTextMock.mockResolvedValue({
      text: "Taylor，\n\n感谢你的耐心等待。我会继续跟进并尽快回复你。",
    });

    await polishTicketReply(ticketContext, "I'll look into it now.", "Administrator");

    expect(createDeepSeekMock).toHaveBeenCalledWith({
      apiKey: "deepseek-test-key",
    });
    expect(deepseekModelFactoryMock).toHaveBeenCalledWith("deepseek-chat");
    expect(generateTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "deepseek-model",
        system: expect.stringContaining("最终回复必须使用简体中文"),
        prompt: expect.stringContaining("客户 first name: Taylor"),
      }),
    );
    expect(generateTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("只使用客户 first name：Taylor"),
      }),
    );
  });

  test("normalizes a slash-prefixed signature into the standard closing block", async () => {
    generateTextMock.mockResolvedValue({
      text: [
        "Taylor，",
        "",
        "感谢你的耐心等待。我会继续跟进并尽快回复你。",
        "",
        "祝好，",
        "/ Administrator",
        "/ dinglinqi07@gmail.com",
      ].join("\n"),
    });

    const result = await polishTicketReply(ticketContext, "我来跟进一下。", "Administrator");

    expect(result).toEqual({
      bodyText: [
        "Taylor，",
        "",
        "感谢你的耐心等待。我会继续跟进并尽快回复你。",
        "",
        "祝好，",
        "Administrator",
        "",
        "dinglinqi07@gmail.com",
      ].join("\n"),
    });
  });

  test("appends the standard closing block when the model returns no signature", async () => {
    generateTextMock.mockResolvedValue({
      text: "Taylor，\n\n感谢你的耐心等待。我会继续跟进并尽快回复你。",
    });

    const result = await polishTicketReply(ticketContext, "我来跟进一下。", "Administrator");

    expect(result.bodyText).toBe(
      [
        "Taylor，",
        "",
        "感谢你的耐心等待。我会继续跟进并尽快回复你。",
        "",
        "祝好，",
        "Administrator",
        "",
        "dinglinqi07@gmail.com",
      ].join("\n"),
    );
  });

  test("throws when the model returns empty text", async () => {
    generateTextMock.mockResolvedValue({
      text: "   ",
    });

    await expect(
      polishTicketReply(ticketContext, "我来跟进一下。", "Administrator"),
    ).rejects.toThrow("DeepSeek returned an empty response.");
  });
});
