import { cn } from "@/lib/cn";

type Gap = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type Direction = "row" | "col";
type Align = "start" | "center" | "end" | "stretch" | "baseline";
type Justify = "start" | "center" | "end" | "between" | "around";

const gapMap: Record<Gap, string> = {
  xs: "gap-1.5",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
  "2xl": "gap-12",
};

const alignMap: Record<Align, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const justifyMap: Record<Justify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
};

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: Direction;
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
}

/**
 * Flex stack with consistent gap tokens. Default column.
 */
export function Stack({
  direction = "col",
  gap = "md",
  align,
  justify,
  wrap,
  className,
  ...props
}: StackProps) {
  return (
    <div
      className={cn(
        "flex",
        direction === "col" ? "flex-col" : "flex-row",
        gapMap[gap],
        align && alignMap[align],
        justify && justifyMap[justify],
        wrap && "flex-wrap",
        className,
      )}
      {...props}
    />
  );
}
