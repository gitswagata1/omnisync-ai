import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

const variants: Record<string, string> = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800',
  secondary: 'bg-zinc-700 text-zinc-100 hover:bg-zinc-600 active:bg-zinc-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800',
  outline: 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800',
};

const sizes: Record<string, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
