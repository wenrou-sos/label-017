import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import { Button } from '@/components/Button';
import type { ViewMode } from './types';
import { calculateGanttTimeRange } from '@/utils/gantt';

interface GanttHeaderProps {
  startDate: Date;
  endDate: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onDateChange: (start: Date, end: Date) => void;
  containerWidth: number;
}

export default function GanttHeader({
  startDate,
  endDate,
  viewMode,
  onViewModeChange,
  onDateChange,
  containerWidth,
}: GanttHeaderProps) {
  const dayRanges = calculateGanttTimeRange({
    startDate,
    endDate,
    columnWidth: 100,
    unit: 'day',
  });

  const hourRanges = calculateGanttTimeRange({
    startDate,
    endDate,
    columnWidth: 50,
    unit: 'hour',
  });

  const handlePrev = () => {
    const days = viewMode === 'week' ? 7 : 1;
    const newStart = dayjs(startDate).subtract(days, 'day').toDate();
    const newEnd = dayjs(endDate).subtract(days, 'day').toDate();
    onDateChange(newStart, newEnd);
  };

  const handleNext = () => {
    const days = viewMode === 'week' ? 7 : 1;
    const newStart = dayjs(startDate).add(days, 'day').toDate();
    const newEnd = dayjs(endDate).add(days, 'day').toDate();
    onDateChange(newStart, newEnd);
  };

  const handleToday = () => {
    const days = viewMode === 'week' ? 7 : 1;
    const start = dayjs().startOf('day').toDate();
    const end = dayjs().startOf('day').add(days, 'day').toDate();
    onDateChange(start, end);
  };

  return (
    <div className="flex flex-col bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handlePrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleToday}>
            <Calendar className="w-4 h-4 mr-1" />
            今天
          </Button>
          <Button size="sm" variant="ghost" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="ml-2 text-sm font-medium text-gray-700">
            {dayjs(startDate).format('YYYY/MM/DD')} - {dayjs(endDate).format('YYYY/MM/DD')}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <Button
            size="sm"
            variant={viewMode === 'day' ? 'primary' : 'ghost'}
            className={cn(viewMode !== 'day' && 'bg-transparent')}
            onClick={() => onViewModeChange('day')}
          >
            <Clock className="w-4 h-4 mr-1" />
            日视图
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'week' ? 'primary' : 'ghost'}
            className={cn(viewMode !== 'week' && 'bg-transparent')}
            onClick={() => onViewModeChange('week')}
          >
            <Calendar className="w-4 h-4 mr-1" />
            周视图
          </Button>
        </div>
      </div>

      <div className="relative flex" style={{ width: containerWidth }}>
        <div className="relative flex border-b border-gray-200" style={{ width: containerWidth }}>
          {dayRanges.map((range, idx) => {
            const isWeekend = dayjs(range.start).day() === 0 || dayjs(range.start).day() === 6;
            return (
              <div
                key={`day-${idx}`}
                className={cn(
                  'flex items-center justify-center h-10 text-xs font-medium border-r border-gray-200',
                  isWeekend ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-700'
                )}
                style={{
                  left: `${range.left}%`,
                  width: `${range.width}%`,
                }}
              >
                {range.label}
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative flex" style={{ width: containerWidth }}>
        <div className="relative flex" style={{ width: containerWidth }}>
          {hourRanges.map((range, idx) => {
            const hour = dayjs(range.start).hour();
            const isWorkHour = hour >= 8 && hour < 20;
            return (
              <div
                key={`hour-${idx}`}
                className={cn(
                  'flex items-center justify-center h-8 text-xs border-r border-gray-100',
                  isWorkHour ? 'text-gray-600 bg-white' : 'text-gray-400 bg-gray-50'
                )}
                style={{
                  left: `${range.left}%`,
                  width: `${range.width}%`,
                }}
              >
                {range.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
