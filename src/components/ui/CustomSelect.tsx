import { useState, useRef, useEffect, useId } from 'react';
import { Check, ChevronDown } from 'lucide-react';

type SelectValue = string | number;

interface Option<T extends SelectValue> {
  value: T;
  label: string;
  description?: string;
}

interface CustomSelectProps<T extends SelectValue> {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  label?: string;
  ariaLabel?: string;
}

export const CustomSelect = <T extends SelectValue,>({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  className = '',
  buttonClassName = '',
  disabled = false,
  label,
  ariaLabel,
}: CustomSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const listboxId = useId();
  const selectedOption = options.find((opt) => opt.value === value);
  const selectedIndex = options.findIndex((option) => option.value === value);

  const openMenu = (preferredIndex = selectedIndex >= 0 ? selectedIndex : 0) => {
    setActiveIndex(options.length > 0 ? Math.min(Math.max(preferredIndex, 0), options.length - 1) : -1);
    setIsOpen(true);
  };

  const selectOption = (option: Option<T>) => {
    onChange(option.value);
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {label && (
        <p className="mb-1.5 text-xs font-bold text-slate-700">{label}</p>
      )}
      <button
        ref={triggerRef}
        id={`${listboxId}-trigger`}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (isOpen) setIsOpen(false);
          else openMenu();
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            openMenu(selectedIndex >= 0 ? selectedIndex : 0);
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            openMenu(selectedIndex >= 0 ? selectedIndex : options.length - 1);
          }
        }}
        className={`
          group flex w-full items-center justify-between gap-2
          rounded-xl border bg-white px-3.5 py-2.5
          text-xs font-semibold text-slate-700 outline-none
          shadow-sm transition-all duration-150
          hover:border-[#B9833F] hover:bg-[#FCFAF6] hover:shadow-[0_8px_20px_-16px_rgba(154,106,48,0.5)]
          focus:border-[#B9833F] focus:ring-2 focus:ring-[#B9833F]/15
          disabled:cursor-not-allowed disabled:opacity-40
          ${isOpen
            ? 'border-[#B9833F] ring-2 ring-[#B9833F]/15 shadow-[0_8px_20px_-16px_rgba(154,106,48,0.5)]'
            : 'border-slate-200 hover:bg-slate-50/50'
          }
          ${buttonClassName}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel ? `${ariaLabel}: ${selectedOption?.label ?? placeholder}` : label}
      >
        <span className={`truncate ${selectedOption ? 'text-slate-800' : 'text-slate-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-all duration-200 ${
            isOpen ? 'rotate-180 text-[#9A6A30]' : 'text-slate-400 group-hover:text-[#9A6A30]'
          }`}
        />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          aria-labelledby={`${listboxId}-trigger`}
          className="
            absolute left-0 z-[60] mt-2 min-w-full overflow-hidden
            rounded-xl border border-slate-200 bg-white
            shadow-xl shadow-slate-900/[0.12]
            animate-scaleIn origin-top
          "
          role="listbox"
        >
          {/* Top accent line */}
          <div className="h-0.5 bg-[#B9833F]" />

          <div className="ibot-scrollbar max-h-60 overflow-y-auto p-1.5">
            {options.length === 0 ? (
              <div className="px-3 py-2.5 text-[11px] font-medium italic text-slate-400">
                No options available
              </div>
            ) : (
              options.map((option, index) => {
                const isSelected = option.value === value;
                return (
                  <div
                    key={option.value}
                    ref={(node) => {
                      optionRefs.current[index] = node;
                    }}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={index === activeIndex ? 0 : -1}
                    onClick={() => selectOption(option)}
                    onMouseEnter={() => setActiveIndex(index)}
                    onFocus={() => setActiveIndex(index)}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        setActiveIndex((current) => (current + 1) % options.length);
                      } else if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        setActiveIndex((current) => (current - 1 + options.length) % options.length);
                      } else if (event.key === 'Home') {
                        event.preventDefault();
                        setActiveIndex(0);
                      } else if (event.key === 'End') {
                        event.preventDefault();
                        setActiveIndex(options.length - 1);
                      } else if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        selectOption(option);
                      } else if (event.key === 'Escape') {
                        event.preventDefault();
                        event.stopPropagation();
                        setIsOpen(false);
                        triggerRef.current?.focus();
                      } else if (event.key === 'Tab') {
                        setIsOpen(false);
                      }
                    }}
                    className={`
                      group/opt flex w-full items-center justify-between
                      rounded-lg px-3 py-2.5 text-left
                      transition-all duration-100
                      ${isSelected
                        ? 'bg-[#24211D] text-white'
                        : 'text-slate-700 hover:bg-[#F4E8D6] hover:text-slate-950'
                      }
                    `}
                  >
                    <div className="min-w-0">
                      <span className={`block truncate text-xs font-semibold ${isSelected ? 'text-white' : ''}`}>
                        {option.label}
                      </span>
                      {option.description && (
                        <span className={`mt-0.5 block truncate text-[10px] font-medium ${isSelected ? 'text-[#E8C794]' : 'text-slate-400'}`}>
                          {option.description}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="ml-2 h-3.5 w-3.5 shrink-0 text-[#E8C794]" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
