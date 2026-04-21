import { cn } from "@/lib/cn";

type Level =
  | "display"
  | "display-sm"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "title-lg"
  | "title"
  | "title-sm";

type Tone = "default" | "strong" | "muted" | "primary" | "onPrimary";

const levelMap: Record<Level, string> = {
  display: "text-display-sm md:text-display",
  "display-sm": "text-display-sm",
  "heading-1": "text-heading-1",
  "heading-2": "text-heading-2",
  "heading-3": "text-heading-3",
  "title-lg": "text-title-lg",
  title: "text-title",
  "title-sm": "text-title-sm",
};

const toneMap: Record<Tone, string> = {
  default: "text-foreground-strong",
  strong: "text-foreground-strong",
  muted: "text-foreground-muted",
  primary: "text-primary",
  onPrimary: "text-white",
};

type As = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div" | "span";

interface HeadingProps extends React.HTMLAttributes<HTMLElement> {
  as?: As;
  level?: Level;
  tone?: Tone;
}

/**
 * Semantic heading with a type-token level.
 * Choose `as` for HTML semantics; `level` controls visual scale.
 */
export function Heading({
  as: Tag = "h2",
  level = "heading-1",
  tone = "strong",
  className,
  ...props
}: HeadingProps) {
  return (
    <Tag
      className={cn(levelMap[level], toneMap[tone], className)}
      {...props}
    />
  );
}
