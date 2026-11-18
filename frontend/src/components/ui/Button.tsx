import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      fullWidth = true,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none rounded-xl text-[13.5px] py-2.5 px-4";

    const variantStyles = {
      primary:
        "bg-[#6558E8] hover:bg-[#594cdb] text-white shadow-[0_4px_14px_rgba(101,88,232,0.35)]",
      secondary:
        "bg-[#EFECE4] hover:bg-[#E7E3D9] text-[#242A26] border border-[#E2DED5]",
      outline:
        "border border-[#DDD8CD] hover:border-[#141A17] text-[#141A17] bg-transparent",
      ghost: "text-[#5A605B] hover:text-[#141A17] hover:bg-black/5 bg-transparent",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${variantStyles[variant]} ${
          fullWidth ? "w-full" : ""
        } ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

