import { cn } from "./utils";

export const appBrandLinkClass =
  "inline-flex items-center gap-3 text-xl font-semibold tracking-[-0.05em] text-panel-foreground transition-opacity hover:opacity-85 md:text-[1.7rem]";

export const appTextLinkClass =
  "text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline";

const appNavLinkBaseClass =
  "rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200";

export function getAppNavLinkClass(isActive: boolean) {
  return cn(
    appNavLinkBaseClass,
    isActive
      ? "bg-brand text-brand-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
      : "text-panel-foreground/70 hover:bg-white/8 hover:text-panel-foreground",
  );
}
