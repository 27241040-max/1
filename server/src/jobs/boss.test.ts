import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  onMock,
  startMock,
  stopMock,
  createQueueMock,
  workMock,
  sendMock,
  pgBossConstructorMock,
  PgBossMock,
  getRequiredEnvMock,
  processTicketAutoClassificationMock,
  processTicketAutoReplyMock,
} = vi.hoisted(() => {
  const onMock = vi.fn();
  const startMock = vi.fn();
  const stopMock = vi.fn();
  const createQueueMock = vi.fn();
  const workMock = vi.fn();
  const sendMock = vi.fn();
  const pgBossConstructorMock = vi.fn();
  class PgBossMock {
    constructor(connectionString: string) {
      pgBossConstructorMock(connectionString);
    }

    on = onMock;
    start = startMock;
    stop = stopMock;
    createQueue = createQueueMock;
    work = workMock;
    send = sendMock;
  }

  return {
    onMock,
    startMock,
    stopMock,
    createQueueMock,
    workMock,
    sendMock,
    pgBossConstructorMock,
    PgBossMock,
    getRequiredEnvMock: vi.fn(),
    processTicketAutoClassificationMock: vi.fn(),
    processTicketAutoReplyMock: vi.fn(),
  };
});

vi.mock("pg-boss", () => ({
  PgBoss: PgBossMock,
}));

vi.mock("../config", () => ({
  getRequiredEnv: getRequiredEnvMock,
}));

vi.mock("../lib/ai/process-ticket-auto-classification", () => ({
  processTicketAutoClassification: processTicketAutoClassificationMock,
}));

vi.mock("../lib/ai/process-ticket-auto-reply", () => ({
  processTicketAutoReply: processTicketAutoReplyMock,
}));

import {
  sendTicketAutoClassificationJob,
  sendTicketAutoReplyJob,
  startBoss,
  stopBoss,
} from "./boss";

describe("boss job integration", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getRequiredEnvMock.mockReturnValue("postgresql://test-connection");
    startMock.mockResolvedValue(undefined);
    stopMock.mockResolvedValue(undefined);
    createQueueMock.mockResolvedValue(undefined);
    workMock.mockResolvedValue("worker-id");
    sendMock.mockResolvedValue("job-id");

    await stopBoss();
  });

  test("starts pg-boss and registers both ticket automation workers", async () => {
    await startBoss();

    expect(pgBossConstructorMock).toHaveBeenCalledWith("postgresql://test-connection");
    expect(onMock).toHaveBeenCalledWith("error", expect.any(Function));
    expect(startMock).toHaveBeenCalledTimes(1);
    expect(createQueueMock).toHaveBeenCalledTimes(2);
    expect(createQueueMock).toHaveBeenNthCalledWith(1, "ticket-auto-classification");
    expect(createQueueMock).toHaveBeenNthCalledWith(2, "ticket-auto-reply");
    expect(workMock).toHaveBeenNthCalledWith(
      1,
      "ticket-auto-classification",
      expect.any(Function),
    );
    expect(workMock).toHaveBeenCalledWith(
      "ticket-auto-reply",
      expect.any(Function),
    );

    const handler = workMock.mock.calls[0]?.[1] as (jobs: Array<{ data?: { ticketId?: number } }>) => Promise<void>;
    await handler([{ data: { ticketId: 7 } }, { data: { ticketId: -1 } }, { data: {} }]);

    expect(processTicketAutoClassificationMock).toHaveBeenCalledTimes(1);
    expect(processTicketAutoClassificationMock).toHaveBeenCalledWith(7);
    expect(sendMock).toHaveBeenCalledWith("ticket-auto-reply", {
      ticketId: 7,
    });
  });

  test("sends ticket classification jobs to the queue", async () => {
    const jobId = await sendTicketAutoClassificationJob(17);

    expect(jobId).toBe("job-id");
    expect(sendMock).toHaveBeenCalledWith("ticket-auto-classification", {
      ticketId: 17,
    });
  });

  test("sends ticket auto reply jobs to the queue", async () => {
    const jobId = await sendTicketAutoReplyJob(18);

    expect(jobId).toBe("job-id");
    expect(sendMock).toHaveBeenCalledWith("ticket-auto-reply", {
      ticketId: 18,
    });
  });

  test("auto reply worker processes valid jobs", async () => {
    await startBoss();

    const replyHandler = workMock.mock.calls[1]?.[1] as (jobs: Array<{ data?: { ticketId?: number } }>) => Promise<void>;
    await replyHandler([{ data: { ticketId: 8 } }, { data: {} }]);

    expect(processTicketAutoReplyMock).toHaveBeenCalledTimes(1);
    expect(processTicketAutoReplyMock).toHaveBeenCalledWith(8);
  });

  test("classification worker still enqueues auto reply when classification fails", async () => {
    processTicketAutoClassificationMock.mockRejectedValueOnce(new Error("classification down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await startBoss();

    const handler = workMock.mock.calls[0]?.[1] as (jobs: Array<{ data?: { ticketId?: number } }>) => Promise<void>;
    await handler([{ data: { ticketId: 19 } }]);

    expect(errorSpy).toHaveBeenCalledWith("工单 19 自动分类失败:", expect.any(Error));
    expect(sendMock).toHaveBeenCalledWith("ticket-auto-reply", {
      ticketId: 19,
    });

    errorSpy.mockRestore();
  });
});
