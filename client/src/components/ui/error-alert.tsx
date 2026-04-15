import type { ComponentType } from "react";

import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ErrorAlertProps = {
  icon?: ComponentType<{ className?: string }>;
  message: string;
  title: string;
};

export function ErrorAlert({
  icon: Icon = AlertCircleIcon,
  message,
  title,
}: ErrorAlertProps) {
  return (
    <Alert variant="destructive">
      <Icon className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
