import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      leftIcon,
      rightElement,
      error,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11.5px] font-medium text-[#464D47] mb-1.5 ml-0.5"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3.5 flex items-center justify-center text-[#8C938E] pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-[#FAF7F0] border rounded-xl py-2.5 text-[13.5px] text-[#141A17] placeholder:text-[#9EA4A0] outline-none transition-colors ${
              leftIcon ? "pl-10" : "pl-3.5"
            } ${rightElement ? "pr-10" : "pr-3.5"} ${
              error
                ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-600"
                : "border-[#DDD8CD] focus:border-[#6558E8] focus:ring-1 focus:ring-[#6558E8]"
            } ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3.5 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[11px] text-red-600 mt-1.5 ml-0.5">{error}</p>
        ) : (
          helperText && (
            <p className="text-[11px] text-[#787F79] mt-1.5 ml-0.5">
              {helperText}
            </p>
          )
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

