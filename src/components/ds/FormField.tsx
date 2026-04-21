import { cn } from "@/lib/cn";

interface FormFieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Label + control + hint/error composition.
 * Supply the input control (DS `Input`, `<textarea>`, `<select>`) as children.
 */
export function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-label text-foreground-strong"
        >
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-label-sm text-danger">{error}</p>
      ) : hint ? (
        <p className="text-label-sm text-foreground-subtle">{hint}</p>
      ) : null}
    </div>
  );
}
