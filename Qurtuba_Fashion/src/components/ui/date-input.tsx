import * as React from "react";

import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "./utils";

type NativeInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "onChange"
>;

type DateInputProps = NativeInputProps & {
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

type Segments = {
  day: string;
  month: string;
  year: string;
};

type SegmentName = keyof Segments;

const EMPTY_SEGMENTS: Segments = { day: "", month: "", year: "" };
const SEGMENT_ORDER: SegmentName[] = ["day", "month", "year"];
const SEGMENT_LIMITS: Record<SegmentName, number> = {
  day: 2,
  month: 2,
  year: 4,
};
const DAY_RANGE = { min: 1, max: 31 };
const MONTH_RANGE = { min: 1, max: 12 };
const YEAR_RANGE = { min: 2000, max: 3000 };

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      className,
      style,
      value,
      defaultValue,
      onChange: externalOnChange,
      name,
      id,
      required,
      disabled,
      onFocus: externalOnFocus,
      onBlur: externalOnBlur,
      ...nativeInputProps
    },
    ref,
  ) => {
    const isControlled = value !== undefined;
    const initialIso = value ?? defaultValue ?? "";
    const [segments, setSegments] = React.useState<Segments>(() =>
      isoToSegments(initialIso),
    );
    const dayRef = React.useRef<HTMLInputElement | null>(null);
    const monthRef = React.useRef<HTMLInputElement | null>(null);
    const yearRef = React.useRef<HTMLInputElement | null>(null);
    const nativeInputRef = React.useRef<HTMLInputElement | null>(null);
    const wrapperRef = React.useRef<HTMLDivElement | null>(null);
    const focusWithinRef = React.useRef(false);

    React.useImperativeHandle(ref, () => nativeInputRef.current as HTMLInputElement);

    React.useEffect(() => {
      if (!isControlled) return;
      const next = isoToSegments(value ?? "");
      setSegments((prev) => (segmentsEqual(prev, next) ? prev : next));
    }, [isControlled, value]);

    const emitChange = React.useCallback(
      (next: Segments, source: "segments" | "native" = "segments") => {
        if (!nativeInputRef.current) return;
        const iso = segmentsToIso(next);
        if (nativeInputRef.current.value !== iso) {
          nativeInputRef.current.value = iso;
        }
        if (source === "segments" && externalOnChange) {
          externalOnChange({
            target: nativeInputRef.current,
            currentTarget: nativeInputRef.current,
          } as React.ChangeEvent<HTMLInputElement>);
        }
      },
      [externalOnChange],
    );

    const focusSegment = React.useCallback(
      (segment: SegmentName) => {
        if (disabled) return;
        const refMap: Record<SegmentName, React.RefObject<HTMLInputElement | null>> = {
          day: dayRef,
          month: monthRef,
          year: yearRef,
        };
        refMap[segment].current?.focus();
      },
      [disabled],
    );

    const handleSegmentChange =
      (segment: SegmentName) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const limit = SEGMENT_LIMITS[segment];
        const rawDigits = event.target.value.replace(/\D/g, "").slice(0, limit);
        const sanitizedValue = sanitizeSegmentValue(segment, rawDigits);

        const nextSegments = { ...segments, [segment]: sanitizedValue };
        setSegments(nextSegments);
        emitChange(nextSegments);

        const nativeEvent = event.nativeEvent as InputEvent | undefined;
        const isDeleting = nativeEvent?.inputType?.includes("delete") ?? false;

        if (!isDeleting && sanitizedValue.length === limit) {
          const next = getNextSegment(segment);
          if (next) {
            requestAnimationFrame(() => focusSegment(next));
          }
        }
      };

    const handleKeyDown =
      (segment: SegmentName) =>
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        const currentValue = segments[segment];
        const selectionStart = event.currentTarget.selectionStart ?? 0;

        if (
          event.key === "Backspace" &&
          selectionStart === 0 &&
          currentValue.length === 0
        ) {
          const prev = getPreviousSegment(segment);
          if (prev) {
            event.preventDefault();
            focusSegment(prev);
          }
        }

        if (event.key === "/" || event.key === "\\") {
          const next = getNextSegment(segment);
          if (next) {
            event.preventDefault();
            focusSegment(next);
          }
        }
      };

    const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
      const text = event.clipboardData?.getData("text") ?? "";
      const digits = text.replace(/\D/g, "").slice(0, 8);
      if (!digits) return;
      event.preventDefault();
      const next = digitsToSegments(digits);
      setSegments(next);
      emitChange(next);
      const targetSegment = getFirstIncompleteSegment(next) ?? "year";
      requestAnimationFrame(() => focusSegment(targetSegment));
    };

    const handleSegmentFocus =
      () => (event: React.FocusEvent<HTMLInputElement>) => {
        event.currentTarget.select();
        if (!focusWithinRef.current) {
          focusWithinRef.current = true;
          externalOnFocus?.(
            event as unknown as React.FocusEvent<HTMLInputElement>,
          );
        }
      };

    const handleSegmentBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      requestAnimationFrame(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;
        if (!wrapper.contains(document.activeElement)) {
          focusWithinRef.current = false;
          externalOnBlur?.(
            event as unknown as React.FocusEvent<HTMLInputElement>,
          );
        }
      });
    };

    const handleShellMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      const target = event.target as HTMLElement;
      if (target.closest("input,button")) return;
      event.preventDefault();
      focusSegment("day");
      requestAnimationFrame(() => dayRef.current?.select());
    };

    const handleNativeInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = isoToSegments(event.target.value);
      setSegments(next);
      emitChange(next, "native");
      externalOnChange?.(event);
    };

    const handleCalendarClick = () => {
      if (disabled) return;
      const input = nativeInputRef.current;
      const picker = input as HTMLInputElement & { showPicker?: () => void };
      if (picker?.showPicker) {
        picker.showPicker();
      }
      focusSegment("day");
      requestAnimationFrame(() => dayRef.current?.select());
    };

    const isoValue = React.useMemo(() => segmentsToIso(segments), [segments]);
    const hasValue =
      segments.day.length > 0 ||
      segments.month.length > 0 ||
      segments.year.length > 0;

    return (
      <div
        ref={wrapperRef}
        className={cn(
          "date-input-shell arabic-date-input",
          className,
          disabled && "opacity-60 pointer-events-none",
        )}
        style={style}
        data-filled={hasValue ? "true" : "false"}
        onMouseDown={handleShellMouseDown}
        onPaste={handlePaste}
      >
        <div className="date-input-content">
          <input
            ref={dayRef}
            id={id}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="يوم"
            className="date-input-segment"
            value={segments.day}
            onChange={handleSegmentChange("day")}
            onKeyDown={handleKeyDown("day")}
            onFocus={handleSegmentFocus()}
            onBlur={handleSegmentBlur}
            disabled={disabled}
            maxLength={2}
            autoComplete="off"
          />
          <span className="date-input-divider">/</span>
          <input
            ref={monthRef}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="شهر"
            className="date-input-segment"
            value={segments.month}
            onChange={handleSegmentChange("month")}
            onKeyDown={handleKeyDown("month")}
            onFocus={handleSegmentFocus()}
            onBlur={handleSegmentBlur}
            disabled={disabled}
            maxLength={2}
            autoComplete="off"
          />
          <span className="date-input-divider">/</span>
          <input
            ref={yearRef}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="سنة"
            className="date-input-segment date-input-segment-year"
            value={segments.year}
            onChange={handleSegmentChange("year")}
            onKeyDown={handleKeyDown("year")}
            onFocus={handleSegmentFocus()}
            onBlur={handleSegmentBlur}
            disabled={disabled}
            maxLength={4}
            autoComplete="off"
          />
        </div>

        <button
          type="button"
          className="date-input-calendar"
          onClick={handleCalendarClick}
          disabled={disabled}
          aria-label="اختر التاريخ من التقويم"
        >
          <CalendarIcon className="date-input-calendar-icon" />
        </button>

        <input
          {...nativeInputProps}
          ref={nativeInputRef}
          type="date"
          name={name}
          value={isoValue}
          onChange={handleNativeInputChange}
          required={required}
          disabled={disabled}
          className="date-input-native"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
    );
  },
);

DateInput.displayName = "DateInput";

export { DateInput };

function isoToSegments(value?: string | null): Segments {
  if (!value) return { ...EMPTY_SEGMENTS };
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return { ...EMPTY_SEGMENTS };
  return normalizeSegments({
    year: match[1],
    month: match[2],
    day: match[3],
  });
}

function digitsToSegments(digits: string): Segments {
  const sanitized = digits.replace(/\D/g, "").slice(0, 8);
  return normalizeSegments({
    day: sanitized.slice(0, 2),
    month: sanitized.slice(2, 4),
    year: sanitized.slice(4, 8),
  });
}

function segmentsToIso(segments: Segments): string {
  if (
    segments.day.length !== 2 ||
    segments.month.length !== 2 ||
    segments.year.length !== 4
  ) {
    return "";
  }
  const iso = `${segments.year}-${segments.month}-${segments.day}`;
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  const matches =
    String(date.getUTCFullYear()).padStart(4, "0") === segments.year &&
    String(date.getUTCMonth() + 1).padStart(2, "0") === segments.month &&
    String(date.getUTCDate()).padStart(2, "0") === segments.day;
  return matches ? iso : "";
}

function getNextSegment(segment: SegmentName): SegmentName | null {
  const index = SEGMENT_ORDER.indexOf(segment);
  return index === -1 || index === SEGMENT_ORDER.length - 1
    ? null
    : SEGMENT_ORDER[index + 1];
}

function getPreviousSegment(segment: SegmentName): SegmentName | null {
  const index = SEGMENT_ORDER.indexOf(segment);
  return index <= 0 ? null : SEGMENT_ORDER[index - 1];
}

function getFirstIncompleteSegment(segments: Segments): SegmentName | null {
  if (!segments.day) return "day";
  if (!segments.month) return "month";
  if (segments.year.length < 4) return "year";
  return null;
}

function segmentsEqual(a: Segments, b: Segments): boolean {
  return a.day === b.day && a.month === b.month && a.year === b.year;
}

function normalizeSegments(input: Segments): Segments {
  return {
    day: sanitizeSegmentValue("day", input.day),
    month: sanitizeSegmentValue("month", input.month),
    year: sanitizeSegmentValue("year", input.year),
  };
}

function sanitizeSegmentValue(segment: SegmentName, raw: string): string {
  if (!raw) return "";
  if (segment === "year") {
    let next = raw.slice(0, 4);
    if (next.length < 4) return next;
    let num = Number(next);
    if (Number.isNaN(num)) num = YEAR_RANGE.min;
    num = clampNumber(num, YEAR_RANGE.min, YEAR_RANGE.max);
    return String(num);
  }

  let next = raw.slice(0, 2);
  if (next.length < 2) return next;
  let num = Number(next);
  if (Number.isNaN(num)) num = 0;
  const range = segment === "day" ? DAY_RANGE : MONTH_RANGE;
  num = clampNumber(num, range.min, range.max);
  return String(num).padStart(2, "0");
}

function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

