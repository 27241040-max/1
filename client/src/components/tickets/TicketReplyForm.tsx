import { zodResolver } from "@hookform/resolvers/zod";
import {
  type TicketReplyCreateInput,
  ticketReplyCreateSchema,
} from "core/email";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TicketReplyFormProps = {
  errorMessage?: string;
  isSubmitting: boolean;
  onSubmit: (values: TicketReplyCreateInput) => Promise<unknown>;
};

export function TicketReplyForm({
  errorMessage,
  isSubmitting,
  onSubmit,
}: TicketReplyFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TicketReplyCreateInput>({
    resolver: zodResolver(ticketReplyCreateSchema),
    defaultValues: {
      bodyText: "",
    },
  });

  return (
    <form
      className="grid gap-3"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        try {
          await onSubmit(values);
          reset();
        } catch {
          // Error state is surfaced through the parent component.
        }
      })}
    >
      <div className="grid gap-2">
        <Label htmlFor="ticket-reply-body">回复内容</Label>
        <Textarea
          id="ticket-reply-body"
          aria-invalid={errors.bodyText ? "true" : "false"}
          disabled={isSubmitting}
          placeholder="输入要发送给客户的回复内容"
          {...register("bodyText")}
        />
        {errors.bodyText ? <ErrorMessage>{errors.bodyText.message}</ErrorMessage> : null}
      </div>

      {errorMessage ? <ErrorMessage>{errorMessage}</ErrorMessage> : null}

      <div>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "提交中..." : "提交回复"}
        </Button>
      </div>
    </form>
  );
}
