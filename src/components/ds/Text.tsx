import { cn } from "@/lib/cn";

type Size =
  | "body-lg"
  | "body"
  | "body-sm"
  | "body-xs"
  | "label-lg"
  | "label"
  | "label-sm"
  | "caption";

type Tone =
  | "default"
  | "strong"
  | "muted"
  | "subtle"
  | "primary"
  | "onPrimary"
  | "danger";

const sizeMap: Record<Size, string> = {
  "body-lg": "text-body-lg",
  body: "text-body",
  "body-sm": "text-body-sm",
  "body-xs": "text-body-xs",
  "label-lg": "text-label-lg",
  label: "text-label",
  "label-sm": "text-label-sm",
  caption: "text-caption",
};

const toneMap: Record<Tone, string> = {
  default: "text-foreground",
  strong: "text-foreground-strong",
  muted: "text-foreground-muted",
  subtle: "text-foreground-subtle",
  primary: "text-primary",
  onPrimary: "text-white",
  danger: "text-danger",
};

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  as?: "p" | "span" | "div" | "li";
  size?: Size;
  tone?: Tone;
  nums?: boolean;
}

/**
 * Body text primitive. Use `nums` for tabular numerals on financial figures.
 */
export function Text({
  as: Tag = "p",
  size = "body",
  tone = "default",
  nums = false,
  className,
  ...props
}: TextProps) {
  return (
    <Tag
      className={cn(sizeMap[size], toneMap[tone], nums && "nums", className)}
      {...props}
    />
  );
}
