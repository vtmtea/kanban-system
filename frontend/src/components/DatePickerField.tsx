import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/context/I18nContext';

interface DatePickerFieldProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  min?: string;
  max?: string;
}

const sizeClasses = {
  sm: 'min-h-[40px] rounded-xl px-4 text-sm',
  md: 'min-h-[48px] rounded-[14px] px-4 text-sm',
  lg: 'min-h-[56px] rounded-[18px] px-5 text-[15px]',
};

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

function toDateString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateString(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function clampMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = firstDay.getDay();
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    return next;
  });
}

export function DatePickerField({
  value,
  defaultValue,
  onChange,
  placeholder,
  size = 'lg',
  className = '',
  min,
  max,
}: DatePickerFieldProps) {
  const { locale, t } = useI18n();
  const isControlled = value !== undefined;
  const resolvedPlaceholder = placeholder || t('datePicker.pickDate');
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const selectedValue = isControlled ? value ?? '' : internalValue;
  const selectedDate = parseDateString(selectedValue);
  const minDate = parseDateString(min);
  const maxDate = parseDateString(max);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [visibleMonth, setVisibleMonth] = useState(() =>
    clampMonth(selectedDate || new Date())
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const weekdayLabels = useMemo(
    () => [
      t('datePicker.su'),
      t('datePicker.mo'),
      t('datePicker.tu'),
      t('datePicker.we'),
      t('datePicker.th'),
      t('datePicker.fr'),
      t('datePicker.sa'),
    ],
    [t]
  );

  const updatePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const panelWidth = Math.max(rect.width, 304);
    const panelHeight = 364;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const left = Math.max(12, Math.min(rect.left, viewportWidth - panelWidth - 12));
    const top =
      rect.bottom + panelHeight + 10 <= viewportHeight
        ? rect.bottom + 10
        : Math.max(12, rect.top - panelHeight - 10);

    setPosition({
      top,
      left,
      width: panelWidth,
    });
  };

  useEffect(() => {
    if (!selectedDate) return;
    setVisibleMonth(clampMonth(selectedDate));
  }, [selectedValue]);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleReposition = () => updatePosition();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen]);

  const commitValue = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
    setIsOpen(false);
  };

  const isDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`inline-flex w-full items-center justify-between gap-3 border border-[#d9e3ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] font-semibold text-[#162231] outline-none shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition hover:border-[#c6d5e4] hover:shadow-[0_14px_30px_rgba(15,23,42,0.07)] focus:border-[#0f4fe6] focus:shadow-[0_0_0_4px_rgba(15,79,230,0.12)] ${sizeClasses[size]} ${className}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className={selectedValue ? '' : 'text-[#7c8ea5]'}>
          {selectedValue || resolvedPlaceholder}
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e8f0f9] text-[#5b6b80]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </span>
      </button>

      {isOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panelRef}
              className="fixed z-[220] rounded-[24px] border border-[#d9e3ef] bg-white p-4 shadow-[0_28px_60px_rgba(15,23,42,0.18)]"
              style={{ top: position.top, left: position.left, width: position.width }}
            >
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f7fb] text-[#334155] transition hover:bg-[#e8eff7]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="text-[15px] font-extrabold text-[#162231]">
                  {visibleMonth.toLocaleString(locale, { month: 'long', year: 'numeric' })}
                </div>
                <button
                  type="button"
                  onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f7fb] text-[#334155] transition hover:bg-[#e8eff7]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {weekdayLabels.map((weekday) => (
                  <div key={weekday} className="pb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#7a8ca5]">
                    {weekday}
                  </div>
                ))}

                {calendarDays.map((day) => {
                  const outsideMonth = day.getMonth() !== visibleMonth.getMonth();
                  const active = selectedDate ? isSameDay(day, selectedDate) : false;
                  const disabled = isDisabled(day);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={disabled}
                      onClick={() => commitValue(toDateString(day))}
                      className={`flex aspect-square items-center justify-center rounded-[14px] text-[13px] font-bold transition ${
                        active
                          ? 'bg-[#0f4fe6] text-white shadow-[0_12px_24px_rgba(15,79,230,0.24)]'
                          : outsideMonth
                            ? 'text-[#b2bfce]'
                            : 'text-[#223042] hover:bg-[#eff4fa]'
                      } ${disabled ? 'cursor-not-allowed opacity-30' : ''}`}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#e6edf5] pt-4">
                <button
                  type="button"
                  onClick={() => commitValue(toDateString(new Date()))}
                  className="text-[13px] font-bold text-[#0f4fe6] transition hover:text-[#0b43c1]"
                >
                  {t('datePicker.today')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl bg-[#f3f7fb] px-4 py-2 text-[13px] font-bold text-[#334155] transition hover:bg-[#e8eff7]"
                >
                  {t('datePicker.close')}
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
