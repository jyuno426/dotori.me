import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variantMap: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-xs hover:bg-primary-dark active:bg-primary-800",
  secondary:
    "bg-surface-muted text-foreground-strong hover:bg-surface-subtle",
  ghost:
    "text-foreground-muted hover:text-foreground-strong hover:bg-surface-muted",
  outline:
    "border border-border-strong text-foreground-strong hover:bg-surface-muted",
};

const sizeMap: Record<Size, string> = {
  sm: "h-9 px-3.5 text-label rounded-md gap-1.5",
  md: "h-11 px-5 text-label-lg rounded-lg gap-2",
  lg: "h-12 px-7 text-body rounded-xl gap-2",
};

const base =
  "inline-flex items-center justify-center font-medium transition-colors duration-[var(--duration-fast)] ease-[var(--ease-quiet)] disabled:opacity-50 disabled:pointer-events-none select-none";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * Button primitive. Pass `href` to render as a Next.js Link.
 */
export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    iconLeft,
    iconRight,
    fullWidth,
    className,
    children,
    ...rest
  } = props;

  const classes = cn(
    base,
    variantMap[variant],
    sizeMap[size],
    fullWidth && "w-full",
    className,
  );

  const content = (
    <>
      {iconLeft}
      {children}
      {iconRight}
    </>
  );

  if ("href" in rest && rest.href) {
    const { href, ...anchorRest } =
      rest as React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
    return (
      <Link href={href} className={classes} {...anchorRest}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
}
