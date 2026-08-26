"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: string;
}

export default function CustomDropdown({
  name,
  options,
  defaultValue,
  value: controlledValue,
  onChange,
  placeholder = "Select...",
}: {
  name: string;
  options: DropdownOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(defaultValue ?? options[0]?.value ?? "");
  const ref = useRef<HTMLDivElement>(null);

  const current = controlledValue ?? selected;
  const selectedOption = options.find((o) => o.value === current);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open]);

  function select(value: string) {
    if (controlledValue === undefined) setSelected(value);
    onChange?.(value);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={current} />

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors outline-none ${
          open
            ? "border-lime-500 ring-1 ring-lime-500/30"
            : "border-slate-200 dark:border-slate-700"
        } bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span className="text-base">{selectedOption.icon}</span>}
          <span className={selectedOption ? "capitalize" : "text-slate-400 dark:text-slate-500"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-lg shadow-slate-900/10 dark:shadow-slate-900/50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="max-h-56 overflow-y-auto py-1">
            {options.map((option) => {
              const isActive = option.value === current;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => select(option.value)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${
                    isActive
                      ? "bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 font-medium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  {option.icon && <span className="text-base">{option.icon}</span>}
                  <span className="capitalize">{option.label}</span>
                  {isActive && (
                    <span className="ml-auto text-lime-500 dark:text-lime-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
