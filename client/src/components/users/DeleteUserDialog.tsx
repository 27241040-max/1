import { AlertTriangleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteUserDialogProps = {
  error?: string;
  isOpen: boolean;
  isSubmitting: boolean;
  name: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function DeleteUserDialog({
  error,
  isOpen,
  isSubmitting,
  name,
  onConfirm,
  onOpenChange,
}: DeleteUserDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>确认删除用户</DialogTitle>
          <DialogDescription>
            删除后，用户 <strong>{name}</strong> 将从默认列表中隐藏，并立即失效。
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>删除失败</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button disabled={isSubmitting} onClick={() => onOpenChange(false)} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={isSubmitting} onClick={onConfirm} type="button" variant="destructive">
            确认删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
