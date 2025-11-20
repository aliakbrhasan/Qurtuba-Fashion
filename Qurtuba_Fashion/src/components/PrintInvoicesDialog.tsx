import * as React from 'react';
import { SimpleModal } from './ui/simple-modal';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';

type DateParts = {
  year: string;
  month: string;
  day: string;
};

type MonthOption = { value: string; label: string };

type PrintInvoicesDialogProps = {
  isOpen: boolean;
  fromDateParts: DateParts;
  toDateParts: DateParts;
  monthOptions: MonthOption[];
  dayOptions: string[];
  printError: string | null;
  onClose: () => void;
  onConfirm: () => void;
  onFromYearChange: (value: string) => void;
  onFromMonthChange: (value: string) => void;
  onFromDayChange: (value: string) => void;
  onToYearChange: (value: string) => void;
  onToMonthChange: (value: string) => void;
  onToDayChange: (value: string) => void;
};

export function PrintInvoicesDialog({
  isOpen,
  fromDateParts,
  toDateParts,
  monthOptions,
  dayOptions,
  printError,
  onClose,
  onConfirm,
  onFromYearChange,
  onFromMonthChange,
  onFromDayChange,
  onToYearChange,
  onToMonthChange,
  onToDayChange,
}: PrintInvoicesDialogProps) {
  return (
    <SimpleModal
      open={isOpen}
      onClose={onClose}
      className="bg-[#F6E9CA] border-[#C69A72]"
    >
      <div className="flex flex-col divide-y divide-[#C69A72]/40">
        <div className="space-y-2 px-6 py-6 text-center sm:text-left">
          <h2 className="text-xl font-semibold text-[#13312A] arabic-text">
            تحديد فترة الطباعة
          </h2>
          <p className="text-sm text-[#155446] arabic-text">
            اختر تاريخ البداية والنهاية قبل طباعة قائمة الفواتير، ويمكنك توسيع الفترة أو
            تقليصها حسب الحاجة.
          </p>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4 rounded-xl border border-[#C69A72] bg-[#FDFBF7] p-4">
              <h3 className="text-lg font-semibold text-[#13312A] arabic-text">
                بداية الفترة (من)
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <DateField
                  label="السنة"
                  value={fromDateParts.year}
                  onChange={onFromYearChange}
                />
                <MonthSelect
                  label="الشهر"
                  value={fromDateParts.month}
                  onChange={onFromMonthChange}
                  options={monthOptions}
                  placeholder="من بداية السنة"
                />
                <DaySelect
                  label="اليوم"
                  value={fromDateParts.day}
                  onChange={onFromDayChange}
                  options={dayOptions}
                  disabled={!fromDateParts.month}
                  placeholder="من بداية الشهر"
                />
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-[#C69A72] bg-[#FDFBF7] p-4">
              <h3 className="text-lg font-semibold text-[#13312A] arabic-text">
                نهاية الفترة (إلى)
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <DateField
                  label="السنة"
                  value={toDateParts.year}
                  onChange={onToYearChange}
                />
                <MonthSelect
                  label="الشهر"
                  value={toDateParts.month}
                  onChange={onToMonthChange}
                  options={monthOptions}
                  placeholder="حتى نهاية السنة"
                />
                <DaySelect
                  label="اليوم"
                  value={toDateParts.day}
                  onChange={onToDayChange}
                  options={dayOptions}
                  disabled={!toDateParts.month}
                  placeholder="حتى نهاية الشهر"
                />
              </div>
            </div>
          </div>

          <p className="text-sm text-[#155446] arabic-text">
            ترك حقل الشهر أو اليوم فارغاً يعني طباعة الفترة الكاملة للسنة أو الشهر المحدد.
            سيتم استخدام تاريخ الاستلام لكل فاتورة لتحديد مدى الطباعة.
          </p>

          {printError && (
            <p className="text-sm text-red-600 arabic-text">{printError}</p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72] touch-target"
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA] touch-target"
          >
            بدء الطباعة
          </Button>
        </div>
      </div>
    </SimpleModal>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const DateField = ({ label, value, onChange }: FieldProps) => (
  <div className="flex flex-col gap-1">
    <Label className="text-[#13312A] arabic-text">{label}</Label>
    <Input
      type="number"
      min={2000}
      max={2100}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="مثال: 2024"
      className="border-[#C69A72] text-right arabic-text touch-target"
    />
  </div>
);

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: MonthOption[] | string[];
  placeholder: string;
  disabled?: boolean;
};

const MonthSelect = ({
  label,
  value,
  onChange,
  options,
  placeholder,
}: SelectFieldProps) => (
  <div className="flex flex-col gap-1">
    <Label className="text-[#13312A] arabic-text">{label}</Label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 border border-[#C69A72] rounded-md bg-white text-[#13312A] arabic-text touch-target focus:border-[#155446] focus:ring-1 focus:ring-[#155446]"
    >
      <option value="">{placeholder}</option>
      {(options as MonthOption[]).map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const DaySelect = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: SelectFieldProps) => (
  <div className="flex flex-col gap-1">
    <Label className="text-[#13312A] arabic-text">{label}</Label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="px-3 py-2 border border-[#C69A72] rounded-md bg-white text-[#13312A] arabic-text touch-target focus:border-[#155446] focus:ring-1 focus:ring-[#155446] disabled:cursor-not-allowed disabled:bg-[#E2D4BD] disabled:text-[#7A6A58]"
    >
      <option value="">{placeholder}</option>
      {(options as string[]).map((day) => (
        <option key={day} value={day}>
          {day}
        </option>
      ))}
    </select>
  </div>
);

