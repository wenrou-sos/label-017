import { Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GanttRow } from './types';

interface GanttSidebarProps {
  rows: GanttRow[];
  rowHeight: number;
  selectedTaskId: string | null;
  onTaskSelect: (taskId: string | null) => void;
}

const statusColors: Record<string, string> = {
  running: 'bg-green-500',
  idle: 'bg-gray-400',
  maintenance: 'bg-orange-500',
  broken: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  running: '运行中',
  idle: '空闲',
  maintenance: '维护中',
  broken: '故障',
};

export default function GanttSidebar({
  rows,
  rowHeight,
}: GanttSidebarProps) {
  const getLoadRateColor = (rate: number) => {
    if (rate >= 90) return 'text-red-600';
    if (rate >= 70) return 'text-orange-600';
    if (rate >= 50) return 'text-blue-600';
    return 'text-green-600';
  };

  const getLoadBarColor = (rate: number) => {
    if (rate >= 90) return 'bg-red-500';
    if (rate >= 70) return 'bg-orange-500';
    if (rate >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex flex-col bg-white border-r border-gray-200" style={{ width: 220 }}>
      <div className="h-[112px] flex items-center justify-center border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <Cpu className="w-4 h-4" />
          机器列表
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {rows.map((row) => (
          <div
            key={row.machineId}
            className={cn(
              'flex flex-col justify-center px-3 border-b border-gray-100 hover:bg-gray-50 transition-colors'
            )}
            style={{ height: rowHeight }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  'w-2.5 h-2.5 rounded-full',
                  statusColors[row.status] || 'bg-gray-400'
                )}
                title={statusLabels[row.status]}
              />
              <span className="text-sm font-medium text-gray-800 truncate">
                {row.machineName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{row.machineCode}</span>
              <span className={cn('text-xs font-semibold', getLoadRateColor(row.loadRate))}>
                {Number(row.loadRate).toFixed(1)}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-300', getLoadBarColor(row.loadRate))}
                style={{ width: `${Math.min(row.loadRate, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
