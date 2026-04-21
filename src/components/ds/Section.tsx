import { cn } from "@/lib/cn";

type Tone = "default" | "muted" | "subtle";
type Size = "sm" | "md" | "lg";

const toneMap: Record<Tone, string> = {
  default: "bg-background",
  muted: "bg-surface/50",
  subtle: "bg-surface-muted",
};

const sizeMap: Record<Size, string> = {
  sm: "py-16 sm:py-20",
  md: "py-20 sm:py-24",
  lg: "py-24 sm:py-32",
};

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  tone?: Tone;
  size?: Size;
  bordered?: boolean;
}

export function Section({
  tone = "default",
  size = "md",
  bordered = false,
  className,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        toneMap[tone],
        sizeMap[size],
        bordered && "border-t border-border",
        className,
      )}
      {...props}
    />
  );
}
