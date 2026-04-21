import { cn } from "@/lib/cn";

type Tone =
  | "primary"
  | "accent"
  | "muted"
  | "success"
  | "warning"
  | "danger"
  | "info";

type Size = "sm" | "md";

const toneMap: Record<Tone, { text: string; bg: string; border: string; dot: string }> = {
  primary: {
    text: "text-primary",
    bg: "bg-primary-50",
    border: "border-primary-100",
    dot: "bg-primary",
  },
  accent: {
    text: "text-accent-dark",
    bg: "bg-accent-50",
    border: "border-accent-100",
    dot: "bg-accent-500",
  },
  muted: {
    text: "text-foreground-muted",
    bg: "bg-surface-muted",
    border: "border-border",
    dot: "bg-foreground-muted",
  },
  success: {
    text: "text-success",
    bg: "bg-success-bg",
    border: "border-primary-100",
    dot: "bg-success",
  },
  warning: {
    text: "text-warning",
    bg: "bg-warning-bg",
    border: "border-accent-100",
    dot: "bg-warning",
  },
  danger: {
    text: "text-danger",
    bg: "bg-danger-bg",
    border: "border-danger/20",
    dot: "bg-danger",
  },
  info: {
    text: "text-info",
    bg: "bg-info-bg",
    border: "border-info/15",
    dot: "bg-info",
  },
};

const sizeMap: Record<Size, string> = {
  sm: "px-2 py-0.5 text-caption",
  md: "px-3 py-1 text-label-sm",
};

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: Size;
  dot?: boolean;
  icon?: React.ReactNode;
  bordered?: boolean;
}

/**
 * Small inline tag. Used for overline chips, status, and metadata.
 */
export function Pill({
  tone = "primary",
  size = "md",
  dot = false,
  icon,
  bordered = true,
  className,
  children,
  ...props
}: PillProps) {
  const t = toneMap[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill font-medium whitespace-nowrap",
        sizeMap[size],
        t.text,
        t.bg,
        bordered && `border ${t.border}`,
        className,
      )}
      {...props}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", t.dot)} />}
      {icon}
      {children}
    </span>
  );
}
