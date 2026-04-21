import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

const sizeMap: Record<Size, string> = {
  sm: "py-10 gap-3",
  md: "py-16 gap-4",
  lg: "py-24 gap-5",
};

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  size?: Size;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = "md",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizeMap[size],
        className,
      )}
      {...props}
    >
      {icon && <div className="text-foreground-subtle">{icon}</div>}
      {title && (
        <h2 className="text-heading-3 text-foreground-strong">{title}</h2>
      )}
      {description && (
        <p className="max-w-sm text-body-sm text-foreground-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
