import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

const sizeMap: Record<Size, string> = {
  sm: "h-9 px-3 text-body-sm rounded-md",
  md: "h-11 px-3.5 text-body rounded-lg",
  lg: "h-12 px-4 text-body rounded-lg",
};

const base =
  "w-full bg-surface border text-foreground placeholder:text-foreground-subtle " +
  "transition-colors duration-[var(--duration-fast)] " +
  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: Size;
  invalid?: boolean;
  nums?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { inputSize = "md", invalid, nums, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        base,
        sizeMap[inputSize],
        invalid ? "border-danger/60" : "border-border",
        nums && "nums",
        className,
      )}
      {...props}
    />
  );
});
