import type { TicketReply } from "core/email";

import { formatTicketDate } from "@/components/tickets/ticket-display";

type TicketReplyThreadProps = {
  replies: TicketReply[];
};

export function TicketReplyThread({ replies }: TicketReplyThreadProps) {
  return (
    <div className="grid gap-3 rounded-[20px] border border-border/70 bg-card p-5 shadow-sm">
      <div className="grid gap-1">
        <span className="text-base font-semibold text-card-foreground">
          回复线程
        </span>
        <span className="text-sm text-muted-foreground">
          按时间顺序显示客服回复。
        </span>
      </div>

      {replies.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/80 bg-muted/25 px-4 py-5 text-sm text-muted-foreground">
          暂无回复
        </p>
      ) : (
        <div className="grid gap-3">
          {replies.map((reply) => (
            <article
              className="grid gap-2 rounded-2xl border border-border/70 bg-background/60 px-4 py-4"
              key={reply.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="grid gap-0.5">
                  <span className="text-sm font-medium text-card-foreground">
                    {reply.author.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {reply.author.email}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTicketDate(reply.createdAt)}
                </span>
              </div>
              <p className="text-sm leading-7 text-card-foreground">
                {reply.bodyText}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
