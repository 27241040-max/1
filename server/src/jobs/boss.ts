import { PgBoss } from "pg-boss";

import { getRequiredEnv } from "../config";
import { processTicketAutoClassification } from "../lib/ai/process-ticket-auto-classification";
import { processTicketAutoReply } from "../lib/ai/process-ticket-auto-reply";

const ticketAutoClassificationQueue = "ticket-auto-classification";
const ticketAutoReplyQueue = "ticket-auto-reply";

type TicketJobData = {
  ticketId: number;
};

let boss: PgBoss | null = null;
let startBossPromise: Promise<PgBoss> | null = null;

function getBoss() {
  if (!boss) {
    boss = new PgBoss(getRequiredEnv("DATABASE_URL"));
    boss.on("error", (error) => {
      console.error("pg-boss error:", error);
    });
  }

  return boss;
}

async function registerWorkers(instance: PgBoss) {
  await instance.createQueue(ticketAutoClassificationQueue);
  await instance.createQueue(ticketAutoReplyQueue);

  await instance.work<TicketJobData>(ticketAutoClassificationQueue, async (jobs) => {
    for (const job of jobs) {
      const ticketId = job.data?.ticketId;

      if (!Number.isInteger(ticketId) || typeof ticketId !== "number" || ticketId <= 0) {
        console.warn("收到无效的工单自动分类任务:", job.data);
        continue;
      }

      try {
        await processTicketAutoClassification(ticketId);
      } catch (error) {
        console.error(`工单 ${ticketId} 自动分类失败:`, error);
      }

      await instance.send(ticketAutoReplyQueue, { ticketId });
    }
  });

  await instance.work<TicketJobData>(ticketAutoReplyQueue, async (jobs) => {
    for (const job of jobs) {
      const ticketId = job.data?.ticketId;

      if (!Number.isInteger(ticketId) || typeof ticketId !== "number" || ticketId <= 0) {
        console.warn("收到无效的工单自动回复任务:", job.data);
        continue;
      }

      await processTicketAutoReply(ticketId);
    }
  });
}

export async function startBoss() {
  if (startBossPromise) {
    return startBossPromise;
  }

  const instance = getBoss();

  startBossPromise = (async () => {
    await instance.start();
    await registerWorkers(instance);
    return instance;
  })().catch((error) => {
    startBossPromise = null;
    throw error;
  });

  return startBossPromise;
}

export async function stopBoss() {
  if (!boss) {
    return;
  }

  try {
    await boss.stop();
  } finally {
    boss = null;
    startBossPromise = null;
  }
}

export async function sendTicketAutoClassificationJob(ticketId: number) {
  const instance = await startBoss();

  return instance.send(ticketAutoClassificationQueue, { ticketId });
}

export async function sendTicketAutoReplyJob(ticketId: number) {
  const instance = await startBoss();

  return instance.send(ticketAutoReplyQueue, { ticketId });
}

export function queueTicketAutoClassification(ticketId: number): void {
  void sendTicketAutoClassificationJob(ticketId).catch((error) => {
    console.error(`工单 ${ticketId} 自动分类任务入队失败:`, error);
  });
}

export function queueTicketAutoReply(ticketId: number): void {
  void sendTicketAutoReplyJob(ticketId).catch((error) => {
    console.error(`工单 ${ticketId} 自动回复任务入队失败:`, error);
  });
}
