export type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const v of inputs) {
    if (!v) continue;
    if (Array.isArray(v)) {
      const s = cn(...v);
      if (s) out.push(s);
    } else if (typeof v === "string" || typeof v === "number") {
      out.push(String(v));
    } else if (typeof v === "object") {
      for (const [key, enabled] of Object.entries(v)) {
        if (enabled) out.push(key);
      }
    }
  }
  return out.join(" ");
}
