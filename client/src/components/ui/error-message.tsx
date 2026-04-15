import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ErrorMessageProps = {
  children: ReactNode;
  className?: string;
};

export function ErrorMessage({ children, className }: ErrorMessageProps) {
  return <p className={cn("text-sm text-destructive", className)}>{children}</p>;
}
