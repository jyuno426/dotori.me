import { cn } from "@/lib/cn";

type Size = "narrow" | "default" | "wide";

const sizeMap: Record<Size, string> = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
};

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: Size;
}

export function Container({
  size = "default",
  className,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn("mx-auto px-6", sizeMap[size], className)}
      {...props}
    />
  );
}
