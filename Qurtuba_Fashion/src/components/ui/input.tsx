import * as React from "react";

import { cn } from "./utils";

function Input({
  className,
  type,
  placeholder,
  dir,
  lang,
  inputMode,
  ...props
}: React.ComponentProps<"input">) {
  const isDateField = type === "date";
  const effectivePlaceholder = isDateField ? placeholder ?? "يوم/شهر/سنة" : placeholder;
  const effectiveDir = isDateField ? dir ?? "ltr" : dir;
  const effectiveLang = isDateField ? lang ?? "ar-SA" : lang;
  const effectiveInputMode = isDateField ? inputMode ?? "numeric" : inputMode;

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        isDateField && "date-input",
        className,
      )}
      placeholder={effectivePlaceholder}
      dir={effectiveDir}
      lang={effectiveLang}
      inputMode={effectiveInputMode}
      data-placeholder={isDateField ? effectivePlaceholder : undefined}
      {...props}
    />
  );
}

export { Input };
