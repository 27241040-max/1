import type { TicketDetail, TicketReplyCreateInput } from "core/email";

import { TicketDetail as TicketDetailSection } from "@/components/tickets/TicketDetail";
import { TicketReplyForm } from "@/components/tickets/TicketReplyForm";
import { TicketReplyThread } from "@/components/tickets/TicketReplyThread";

type FormDetailsProps = {
  data: TicketDetail;
  replyErrorMessage?: string;
  replyIsSubmitting: boolean;
  onReplySubmit: (values: TicketReplyCreateInput) => Promise<unknown>;
};

export function FormDetails({
  data,
  replyErrorMessage,
  replyIsSubmitting,
  onReplySubmit,
}: FormDetailsProps) {
  return (
    <div className="grid gap-5">
      <TicketDetailSection ticket={data} />
      <TicketReplyThread replies={data.replies ?? []} />

      <div className="grid gap-4 rounded-[20px] border border-border/70 bg-card p-5 shadow-sm">
        <div className="grid gap-1">
          <span className="text-base font-semibold text-card-foreground">添加回复</span>
          <span className="text-sm text-muted-foreground">回复会记录在线程中，不会自动修改工单状态。</span>
        </div>

        <TicketReplyForm
          errorMessage={replyErrorMessage}
          isSubmitting={replyIsSubmitting}
          onSubmit={onReplySubmit}
        />
      </div>
    </div>
  );
}
