import { cn } from '@/lib/utils';

type StatusType =
  | 'pending'
  | 'scheduled'
  | 'producing'
  | 'completed'
  | 'cancelled'
  | 'in_progress'
  | 'running'
  | 'idle'
  | 'maintenance'
  | 'broken'
  | 'active'
  | 'disabled'
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-gray-100 text-gray-700' },
  scheduled: { label: '已排程', className: 'bg-blue-100 text-blue-700' },
  producing: { label: '生产中', className: 'bg-yellow-100 text-yellow-700' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', className: 'bg-red-100 text-red-700' },
  in_progress: { label: '进行中', className: 'bg-yellow-100 text-yellow-700' },
  running: { label: '运行中', className: 'bg-green-100 text-green-700' },
  idle: { label: '空闲', className: 'bg-gray-100 text-gray-700' },
  maintenance: { label: '维护中', className: 'bg-orange-100 text-orange-700' },
  broken: { label: '故障', className: 'bg-red-100 text-red-700' },
  active: { label: '启用', className: 'bg-green-100 text-green-700' },
  disabled: { label: '禁用', className: 'bg-gray-100 text-gray-700' },
  low: { label: '低', className: 'bg-gray-100 text-gray-700' },
  medium: { label: '中', className: 'bg-blue-100 text-blue-700' },
  high: { label: '高', className: 'bg-orange-100 text-orange-700' },
  urgent: { label: '紧急', className: 'bg-red-100 text-red-700' },
};

export interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 opacity-60 bg-current" />
      {config.label}
    </span>
  );
}
