import { cn } from '@/lib/utils';

const variants: Record<string, string> = {
  default: 'bg-zinc-700 text-zinc-100',
  success:
    'bg-emerald-900/50 text-emerald-400 border-emerald-800 light:bg-emerald-100 light:text-emerald-700 light:border-emerald-200',
  warning:
    'bg-amber-900/50 text-amber-400 border-amber-800 light:bg-amber-100 light:text-amber-700 light:border-amber-200',
  danger:
    'bg-red-900/50 text-red-400 border-red-800 light:bg-red-100 light:text-red-700 light:border-red-200',
  info: 'bg-blue-900/50 text-blue-400 border-blue-800 light:bg-blue-100 light:text-blue-700 light:border-blue-200',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
