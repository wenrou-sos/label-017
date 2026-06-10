import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export default function Loading({
  size = 'md',
  text,
  fullScreen = false,
  className,
}: LoadingProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className={cn('text-primary animate-spin', sizeStyles[size])} />
          {text && <span className="text-gray-600">{text}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn('text-primary animate-spin', sizeStyles[size])} />
      {text && <span className="text-gray-600">{text}</span>}
    </div>
  );
}
