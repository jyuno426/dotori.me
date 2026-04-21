import { cn } from "@/lib/cn";

interface DangerZoneProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  action: React.ReactNode;
  className?: string;
}

/**
 * 파괴적 액션(삭제 등) 전용 영역. 페이지 하단에 배치해
 * 실수 클릭을 줄이고, 붉은 보더로 위험성을 시각적으로 고지한다.
 */
export function DangerZone({
  title,
  description,
  action,
  className,
}: DangerZoneProps) {
  return (
    <section
      className={cn(
        "mt-8 pt-8 border-t border-border",
        className,
      )}
    >
      <p className="text-overline text-danger mb-3">Danger zone</p>
      <div className="rounded-xl border border-danger/25 bg-danger-bg/40 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-title text-foreground-strong">{title}</h3>
          {description && (
            <p className="mt-1 text-body-sm text-foreground-muted">
              {description}
            </p>
          )}
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    </section>
  );
}
