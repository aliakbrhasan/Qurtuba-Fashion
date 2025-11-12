import * as React from "react";

import { Input } from "./input";
import { cn } from "./utils";

type BaseInputProps = React.ComponentPropsWithoutRef<"input">;

interface DateFieldProps extends Omit<BaseInputProps, "type"> {
  wrapperClassName?: string;
  placeholder?: string;
}

const toStringValue = (value: unknown) => {
  if (value === undefined || value === null) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.join("");
  }

  return String(value);
};

const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(
  (
    {
      className,
      wrapperClassName,
      placeholder = "يوم/شهر/سنة",
      value,
      defaultValue,
      dir = "ltr",
      lang = "ar-SA",
      inputMode = "numeric",
      onChange,
      onBlur,
      onFocus,
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const wrapperRef = React.useRef<HTMLSpanElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const readCurrentValue = React.useCallback(() => {
      if (value !== undefined) {
        return toStringValue(value);
      }

      if (inputRef.current) {
        return inputRef.current.value;
      }

      if (defaultValue !== undefined) {
        return toStringValue(defaultValue);
      }

      return "";
    }, [value, defaultValue]);

    const [hasValue, setHasValue] = React.useState(() => readCurrentValue() !== "");

    React.useEffect(() => {
      setHasValue(readCurrentValue() !== "");
    }, [readCurrentValue]);

  const placeholderSegments = React.useMemo(
    () =>
      placeholder
        .split("/")
        .map((segment) => segment.trim())
        .filter(Boolean),
    [placeholder],
  );

    React.useLayoutEffect(() => {
      const inputElement = inputRef.current;
      const wrapperElement = wrapperRef.current;

      if (!inputElement || !wrapperElement) {
        return;
      }

      const computedStyle = window.getComputedStyle(inputElement);
      const paddingStart =
        computedStyle.paddingInlineStart || computedStyle.paddingLeft || "0.75rem";
      const paddingEnd =
        computedStyle.paddingInlineEnd || computedStyle.paddingRight || "0.75rem";

      wrapperElement.style.setProperty("--date-field-padding-inline-start", paddingStart);
      wrapperElement.style.setProperty("--date-field-padding-inline-end", paddingEnd);
    }, [className, hasValue]);

    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setHasValue(event.target.value !== "");
        onChange?.(event);
      },
      [onChange],
    );

    const handleBlur = React.useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
        setHasValue(event.target.value !== "");
        onBlur?.(event);
      },
      [onBlur],
    );

    const handleFocus = React.useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
        setHasValue(event.target.value !== "");
        onFocus?.(event);
      },
      [onFocus],
    );

    return (
      <span ref={wrapperRef} className={cn("date-field-wrapper", wrapperClassName)}>
        <Input
          ref={inputRef}
          type="date"
          className={cn(
            "date-field-input",
            hasValue ? "date-field-input--filled" : "date-field-input--empty",
            className,
          )}
          placeholder={placeholder}
          dir={dir}
          lang={lang}
          inputMode={inputMode}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          data-placeholder={placeholder}
          {...props}
        />
        <span
          className={cn(
            "date-field-placeholder arabic-text",
            hasValue ? "date-field-placeholder--hidden" : "date-field-placeholder--visible",
          )}
          aria-hidden="true"
        >
          {placeholderSegments.length > 1 ? (
            <span className="date-field-placeholder-content">
              {placeholderSegments.map((segment, index) => (
                <React.Fragment key={`${segment}-${index}`}>
                  <span className="date-field-placeholder-part">{segment}</span>
                  {index < placeholderSegments.length - 1 && (
                    <span className="date-field-placeholder-separator">/</span>
                  )}
                </React.Fragment>
              ))}
            </span>
          ) : (
            placeholder
          )}
        </span>
      </span>
    );
  },
);

DateField.displayName = "DateField";

export { DateField };

