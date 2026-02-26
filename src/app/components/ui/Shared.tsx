import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'default' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          // Variants
          variant === 'primary' && "bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-600/20",
          variant === 'secondary' && "bg-teal-50 text-teal-900 hover:bg-teal-100",
          variant === 'outline' && "border-2 border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700",
          variant === 'ghost' && "hover:bg-slate-100 text-slate-600",
          // Sizes
          size === 'default' && "h-12 px-6 py-2 text-base",
          size === 'lg' && "h-14 px-8 text-lg font-semibold",
          size === 'icon' && "h-12 w-12",
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export function MobileContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-0 sm:p-4 font-sans text-slate-900">
      <div className={cn("w-full max-w-[480px] bg-white min-h-screen sm:min-h-[800px] sm:rounded-3xl sm:shadow-2xl overflow-hidden relative flex flex-col", className)}>
        {children}
      </div>
    </div>
  );
}
