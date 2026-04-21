import { cn } from "@/lib/cn";

type Tone = "default" | "muted" | "primary" | "elevated";
type Padding = "sm" | "md" | "lg" | "none";
type Radius = "md" | "lg" | "xl" | "2xl";

const toneMap: Record<Tone, string> = {
  default: "bg-surface border border-border",
  muted: "bg-surface-muted/40 border border-border",
  primary:
    "bg-primary-50/60 border border-primary-100",
  elevated: "bg-surface border border-border shadow-md",
};

const paddingMap: Record<Padding, string> = {
  none: "",
  sm: "p-5",
  md: "p-6 sm:p-7",
  lg: "p-7 sm:p-8",
};

const radiusMap: Record<Radius, string> = {
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
  "2xl": "rounded-3xl",
};

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  tone?: Tone;
  padding?: Padding;
  radius?: Radius;
  interactive?: boolean;
  as?: "div" | "article" | "section" | "li";
}

export function Card({
  as: Tag = "div",
  tone = "default",
  padding = "md",
  radius = "lg",
  interactive = false,
  className,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(
        toneMap[tone],
        paddingMap[padding],
        radiusMap[radius],
        interactive &&
          "transition-colors duration-[var(--duration-fast)] hover:border-primary-200",
        className,
      )}
      {...props}
    />
  );
}
