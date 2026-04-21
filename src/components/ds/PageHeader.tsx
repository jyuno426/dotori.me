import { cn } from "@/lib/cn";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * 앱 내부 페이지 상단 헤더 — 타이틀 + 우측 액션 버튼.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
        className,
      )}
      {...props}
    >
      <div>
        <h1 className="text-heading-2 text-foreground-strong">{title}</h1>
        {description && (
          <p className="mt-1 text-body-sm text-foreground-muted">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
