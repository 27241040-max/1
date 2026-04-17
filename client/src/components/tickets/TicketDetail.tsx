import type {
  TicketDetail as TicketDetailData,
  TicketSummaryResult,
} from "core/email";
import { SparklesIcon } from "lucide-react";

import { formatTicketDate, getTicketStatusLabel } from "@/components/tickets/ticket-display";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";

type TicketDetailProps = {
  isSummarizing: boolean;
  onSummarize: () => void;
  summary: TicketSummaryResult | null;
  summaryErrorMessage?: string;
  ticket: TicketDetailData;
};

export function TicketDetail({
  isSummarizing,
  onSummarize,
  summary,
  summaryErrorMessage,
  ticket,
}: TicketDetailProps) {
  const wasAutoResolved = ticket.replies.some((reply) => reply.source === "ai_auto_resolution");

  return (
    <>
      <div className="grid gap-1.5">
        <h2 className="text-3xl font-semibold tracking-[-0.04em] text-card-foreground">
          {ticket.subject}
        </h2>
        <p className="text-sm text-muted-foreground">工单 #{ticket.id}</p>
      </div>

      <div className="grid gap-2 text-sm">
        <p className="text-card-foreground">
          <span className="text-muted-foreground">客户:</span>{" "}
          {ticket.customer.name} ({ticket.customer.email})
        </p>
        <p className="text-card-foreground">
          <span className="text-muted-foreground">当前状态:</span>{" "}
          {getTicketStatusLabel(ticket.status)}
        </p>
        <p className="text-card-foreground">
          <span className="text-muted-foreground">创建时间:</span>{" "}
          {formatTicketDate(ticket.createdAt)}
        </p>
        <p className="text-card-foreground">
          <span className="text-muted-foreground">更新时间:</span>{" "}
          {formatTicketDate(ticket.updatedAt)}
        </p>
      </div>

      <div className="grid gap-3 rounded-[20px] border border-border/70 bg-card p-5 shadow-sm">
        <span className="text-base font-semibold text-card-foreground">
          正文
        </span>
        <span className="text-sm text-muted-foreground">
          来自 {ticket.customer.name}
        </span>
        <p className="whitespace-pre-wrap text-sm leading-7 text-card-foreground">
          {ticket.bodyText}
        </p>

        {ticket.status === "resolved" && wasAutoResolved ? (
          <p className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
            该工单已由知识库自动处理，并已生成系统回复。
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={isSummarizing}
            onClick={onSummarize}
            type="button"
            variant="outline"
          >
            <SparklesIcon className="size-4" />
            {isSummarizing ? "Summarizing..." : "Summarize"}
          </Button>
          <span className="text-xs text-muted-foreground">
            基于正文和回复历史即时重新生成摘要
          </span>
        </div>

        {summaryErrorMessage ? (
          <ErrorMessage>{summaryErrorMessage}</ErrorMessage>
        ) : null}

        {summary ? (
          <div className="grid gap-2 rounded-2xl border border-border/70 bg-background/60 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-card-foreground">
                摘要
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTicketDate(summary.generatedAt)}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7 text-card-foreground">
              {summary.bodyText}
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
