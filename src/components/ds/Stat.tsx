import { cn } from "@/lib/cn";

type Tone = "default" | "primary" | "success" | "danger" | "muted";

const toneMap: Record<Tone, string> = {
  default: "text-foreground-strong",
  primary: "text-primary-dark",
  success: "text-success",
  danger: "text-danger",
  muted: "text-foreground-subtle",
};

interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: Tone;
}

/**
 * Standard stat card: label row + large numeric value + optional hint.
 * Use with `tone="success"`/"danger"` for P&L colour coding.
 */
export function Stat({
  icon,
  label,
  value,
  hint,
  tone = "default",
  className,
  ...props
}: StatProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-5",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2 text-label text-foreground-muted">
        {icon}
        {label}
      </div>
      <p
        className={cn(
          "mt-2 text-heading-2 nums",
          toneMap[tone],
        )}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-caption text-foreground-subtle">{hint}</p>
      )}
    </div>
  );
}
