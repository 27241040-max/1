import type { TicketDetail as TicketDetailData } from "core/email";

import { formatTicketDate } from "@/components/tickets/ticket-display";

type TicketDetailProps = {
  ticket: TicketDetailData;
};

export function TicketDetail({ ticket }: TicketDetailProps) {
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
          <span className="text-muted-foreground">客户:</span> {ticket.customer.name} ({ticket.customer.email})
        </p>
        <p className="text-card-foreground">
          <span className="text-muted-foreground">创建时间:</span> {formatTicketDate(ticket.createdAt)}
        </p>
        <p className="text-card-foreground">
          <span className="text-muted-foreground">更新时间:</span> {formatTicketDate(ticket.updatedAt)}
        </p>
      </div>

      <div className="grid gap-3 rounded-[20px] border border-border/70 bg-card p-5 shadow-sm">
        <span className="text-base font-semibold text-card-foreground">正文</span>
        <span className="text-sm text-muted-foreground">来自 {ticket.customer.name}</span>
        <p className="whitespace-pre-wrap text-sm leading-7 text-card-foreground">{ticket.bodyText}</p>
      </div>
    </>
  );
}
