import { useState, useRef, useEffect } from 'react';
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
}: CustomSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {label && (
        <p className="mb-1.5 text-xs font-bold text-slate-700">{label}</p>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          group flex w-full items-center justify-between gap-2
          rounded-xl border bg-white px-3.5 py-2.5
          text-xs font-semibold text-slate-700 outline-none
          shadow-sm transition-all duration-150
          hover:border-emerald-400 hover:shadow-emerald-100/70
          focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100
          disabled:cursor-not-allowed disabled:opacity-40
          ${isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-emerald-100/70'
            : 'border-slate-200 hover:bg-slate-50/50'
          }
          ${buttonClassName}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`truncate ${selectedOption ? 'text-slate-800' : 'text-slate-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-all duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="
            absolute left-0 z-[60] mt-2 min-w-full overflow-hidden
            rounded-xl border border-slate-200 bg-white
            shadow-xl shadow-slate-900/[0.12]
            animate-scaleIn origin-top
          "
          role="listbox"
        >
          {/* Top accent line */}
          <div className="h-0.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400" />

          <div className="ibot-scrollbar max-h-60 overflow-y-auto p-1.5">
            {options.length === 0 ? (
              <div className="px-3 py-2.5 text-[11px] font-medium italic text-slate-400">
                No options available
              </div>
            ) : (
              options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`
                      group/opt flex w-full items-center justify-between
                      rounded-lg px-3 py-2.5 text-left
                      transition-all duration-100
                      ${isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                      }
                    `}
                  >
                    <div className="min-w-0">
                      <span className={`block truncate text-xs font-semibold ${isSelected ? 'text-white' : ''}`}>
                        {option.label}
                      </span>
                      {option.description && (
                        <span className={`mt-0.5 block truncate text-[10px] font-medium ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>
                          {option.description}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="ml-2 h-3.5 w-3.5 shrink-0 text-emerald-200" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
