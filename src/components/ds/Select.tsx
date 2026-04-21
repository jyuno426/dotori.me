import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

const sizeMap: Record<Size, string> = {
  sm: "h-9 px-3 text-body-sm rounded-md",
  md: "h-11 px-3.5 text-body rounded-lg",
  lg: "h-12 px-4 text-body rounded-lg",
};

const base =
  "w-full bg-surface border text-foreground " +
  "transition-colors duration-[var(--duration-fast)] " +
  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary " +
  "disabled:opacity-60 disabled:cursor-not-allowed " +
  "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22></polyline></svg>')] bg-[length:16px_16px] bg-no-repeat bg-[right_0.75rem_center] pr-9";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  selectSize?: Size;
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { selectSize = "md", invalid, className, children, ...props },
    ref,
  ) {
    return (
      <select
        ref={ref}
        className={cn(
          base,
          sizeMap[selectSize],
          invalid ? "border-danger/60" : "border-border",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);
