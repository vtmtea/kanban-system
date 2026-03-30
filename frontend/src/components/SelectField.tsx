import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
}

interface SelectFieldProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg' | 'pill';
  className?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
  disabled?: boolean;
}

const triggerSizeClasses = {
  sm: 'min-h-[40px] rounded-xl px-4 text-sm',
  md: 'min-h-[48px] rounded-[14px] px-4 text-sm',
  lg: 'min-h-[56px] rounded-[18px] px-5 text-[15px]',
  pill: 'min-h-[40px] rounded-full px-4 text-[10px] uppercase tracking-[0.18em]',
};

const triggerDefaultClasses = {
  sm: 'w-full border border-[#d9e3ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-[#162231] shadow-[0_10px_24px_rgba(15,23,42,0.04)]',
  md: 'w-full border border-[#d9e3ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-[#162231] shadow-[0_10px_24px_rgba(15,23,42,0.04)]',
  lg: 'w-full border border-[#d9e3ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-[#162231] shadow-[0_12px_28px_rgba(15,23,42,0.05)]',
  pill: 'min-w-[132px] border border-[#c9daf8] bg-[linear-gradient(180deg,#eff5ff_0%,#e5efff_100%)] text-[#0d6efd] shadow-[0_8px_20px_rgba(15,79,230,0.12)]',
};

export function SelectField({
  options,
  value,
  defaultValue,
  onChange,
  placeholder = 'Select option',
  size = 'lg',
  className = '',
  menuClassName = '',
  align = 'left',
  disabled = false,
}: SelectFieldProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedValue = isControlled ? value ?? '' : internalValue;
  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedValue),
    [options, selectedValue]
  );

  const updatePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const menuWidth = size === 'pill' ? Math.max(rect.width, 180) : rect.width;
    const menuHeight = Math.min(options.length * 64 + 16, 296);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const rawLeft = align === 'right' ? rect.right - menuWidth : rect.left;
    const left = Math.max(12, Math.min(rawLeft, viewportWidth - menuWidth - 12));
    const top =
      rect.bottom + menuHeight + 10 <= viewportHeight
        ? rect.bottom + 10
        : Math.max(12, rect.top - menuHeight - 10);

    setPosition({
      top,
      left,
      width: menuWidth,
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
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
  }, [isOpen, align, options.length, size]);

  const commitValue = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${size === 'pill' ? 'inline-block' : 'w-full'}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((open) => !open)}
        className={`relative inline-flex items-center justify-between gap-3 font-semibold outline-none transition hover:border-[#c6d5e4] hover:shadow-[0_14px_30px_rgba(15,23,42,0.07)] focus:border-[#0f4fe6] focus:shadow-[0_0_0_4px_rgba(15,79,230,0.12)] disabled:cursor-not-allowed disabled:opacity-60 ${triggerSizeClasses[size]} ${triggerDefaultClasses[size]} ${className}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`truncate ${selectedOption ? '' : 'text-[#7c8ea5]'}`}>
          {selectedOption?.label || placeholder}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 transition ${isOpen ? 'rotate-180' : ''} ${size === 'pill' ? 'text-[#0d6efd]' : 'text-[#5b6b80]'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              className={`fixed z-[220] overflow-hidden rounded-[22px] border border-[#d9e3ef] bg-white p-2 shadow-[0_28px_60px_rgba(15,23,42,0.18)] ${menuClassName}`}
              style={{ top: position.top, left: position.left, width: position.width }}
            >
              <div className="max-h-[280px] overflow-y-auto">
                {options.map((option) => {
                  const isSelected = option.value === selectedValue;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => commitValue(option.value)}
                      className={`flex w-full items-start gap-3 rounded-[16px] px-4 py-3 text-left transition ${
                        isSelected
                          ? 'bg-[#eef4ff] text-[#0f4fe6]'
                          : 'text-[#1f2c3d] hover:bg-[#f4f8fc]'
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                          isSelected ? 'bg-[#0f4fe6]' : 'bg-[#d0dae6]'
                        }`}
                      />
                      <span className="min-w-0">
                        <span className={`block ${size === 'pill' ? 'text-[11px] font-extrabold uppercase tracking-[0.16em]' : 'text-[14px] font-bold'}`}>
                          {option.label}
                        </span>
                        {option.description ? (
                          <span className="mt-1 block text-[12px] font-medium text-[#6d7f96]">
                            {option.description}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
