import { InputHTMLAttributes, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = "", ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-[var(--fg)]">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--fg-muted)]">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`block w-full rounded-[var(--radius-sm)] border bg-white px-3 py-2.5 text-sm text-[var(--fg)] placeholder:text-[var(--fg-muted)]/60 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400 ${icon ? "pl-10" : ""} ${error ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300"} ${className}`}
          {...props}
        />
        {icon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[var(--fg-muted)]/40">
            {icon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-[var(--fg-muted)]">{hint}</p>}
    </div>
  )
);
Input.displayName = "Input";
