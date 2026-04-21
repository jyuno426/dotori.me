import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "danger" | "primary";

const toneMap: Record<Tone, { border: string; bg: string; icon: string; title: string }> = {
  info: {
    border: "border-info/20",
    bg: "bg-info-bg",
    icon: "text-info",
    title: "text-info",
  },
  success: {
    border: "border-primary-200",
    bg: "bg-success-bg",
    icon: "text-success",
    title: "text-success",
  },
  warning: {
    border: "border-accent-200",
    bg: "bg-warning-bg",
    icon: "text-warning",
    title: "text-warning",
  },
  danger: {
    border: "border-danger/25",
    bg: "bg-danger-bg",
    icon: "text-danger",
    title: "text-danger",
  },
  primary: {
    border: "border-primary-100",
    bg: "bg-primary-50",
    icon: "text-primary",
    title: "text-primary-dark",
  },
};

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  icon?: React.ReactNode;
  title?: React.ReactNode;
}

export function Alert({
  tone = "info",
  icon,
  title,
  className,
  children,
  ...props
}: AlertProps) {
  const t = toneMap[tone];
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4",
        t.border,
        t.bg,
        className,
      )}
      {...props}
    >
      {icon && <div className={cn("shrink-0 mt-0.5", t.icon)}>{icon}</div>}
      <div className="flex-1 space-y-1">
        {title && (
          <p className={cn("text-title-sm", t.title)}>{title}</p>
        )}
        {children && (
          <div className="text-body-sm text-foreground">{children}</div>
        )}
      </div>
    </div>
  );
}
