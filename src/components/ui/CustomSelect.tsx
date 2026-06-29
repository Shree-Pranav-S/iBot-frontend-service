import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  buttonClassName = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition-all hover:border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${buttonClassName}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`ml-2 h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-60 overflow-y-auto rounded-lg border border-slate-200/80 bg-white p-1 shadow-lg animate-scaleIn ibot-scrollbar">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 italic">No options available</div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition-all ${
                  option.value === value
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950 hover:scale-[1.01]'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && <Check className="h-3.5 w-3.5 text-white shrink-0 ml-2" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
