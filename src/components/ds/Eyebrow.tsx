import { cn } from "@/lib/cn";

type Tone = "primary" | "accent" | "muted";

const toneMap: Record<Tone, string> = {
  primary: "text-primary",
  accent: "text-accent-dark",
  muted: "text-foreground-muted",
};

interface EyebrowProps extends React.HTMLAttributes<HTMLParagraphElement> {
  tone?: Tone;
}

/**
 * Section overline label. Renders as text-overline (13/18, 0.04em, 600).
 */
export function Eyebrow({
  tone = "primary",
  className,
  ...props
}: EyebrowProps) {
  return (
    <p
      className={cn("text-overline mb-3", toneMap[tone], className)}
      {...props}
    />
  );
}
