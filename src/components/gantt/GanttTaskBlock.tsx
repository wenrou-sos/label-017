import { useState } from 'react';
import { Clock, Package } from 'lucide-react';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import type { GanttTask } from './types';
import { priorityColors, priorityGlowColors } from './types';

interface GanttTaskBlockProps {
  task: GanttTask;
  left: number;
  width: number;
  top: number;
  isSelected: boolean;
  isDragging: boolean;
  isResizing: boolean;
  onSelect: (task: GanttTask) => void;
  onDragStart: (task: GanttTask, type: 'move' | 'resize-left' | 'resize-right', e: React.MouseEvent) => void;
  containerWidth: number;
  minWidth?: number;
}

export default function GanttTaskBlock({
  task,
  left,
  width,
  top,
  isSelected,
  isDragging,
  isResizing,
  onSelect,
  onDragStart,
  minWidth = 40,
}: GanttTaskBlockProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const colors = priorityColors[task.priority];
  const glowColor = priorityGlowColors[task.priority];

  const formatDuration = (start: Date, end: Date) => {
    const hours = dayjs(end).diff(dayjs(start), 'hour', true);
    if (hours < 1) {
      return `${Math.round(hours * 60)}分钟`;
    }
    return `${Number(hours).toFixed(1)}小时`;
  };

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize-left' | 'resize-right') => {
    e.stopPropagation();
    onDragStart(task, type, e);
  };

  return (
    <>
      <div
        className={cn(
          'absolute rounded-md border cursor-move overflow-hidden transition-all duration-150',
          colors.bg,
          colors.border,
          colors.text,
          isSelected && `ring-2 ring-offset-1 shadow-lg ${glowColor}`,
          task.hasConflict && 'animate-pulse border-red-600 border-2',
          (isDragging || isResizing) && 'opacity-50',
          width < minWidth && 'justify-center'
        )}
        style={{
          left: `${left}%`,
          width: `${Math.max(width, (minWidth / 1000) * 100)}%`,
          top,
          height: 'calc(100% - 8px)',
          marginTop: 4,
          minWidth: minWidth,
        }}
        onClick={() => onSelect(task)}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 z-10"
          onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 z-10"
          onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
        />

        <div className="px-2 py-1 h-full flex flex-col justify-center overflow-hidden">
          {width >= 80 && (
            <>
              <div className="flex items-center gap-1 text-xs font-medium truncate">
                <Package className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{task.orderNo}</span>
              </div>
              <div className="text-xs opacity-90 truncate mt-0.5">
                {task.productName}
              </div>
              <div className="flex items-center gap-1 text-xs opacity-80 mt-0.5">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span>{formatDuration(task.startTime, task.endTime)}</span>
              </div>
            </>
          )}
          {width < 80 && width >= 50 && (
            <div className="text-xs font-medium text-center truncate">
              {task.orderNo}
            </div>
          )}
        </div>
      </div>

      {showTooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl pointer-events-none"
          style={{
            left: `${left}%`,
            top: `${top + 40}px`,
            minWidth: 200,
          }}
        >
          <div className="font-medium mb-1">{task.orderNo}</div>
          <div className="text-gray-300 mb-1">{task.productName}</div>
          <div className="text-gray-300">
            开始: {dayjs(task.startTime).format('YYYY-MM-DD HH:mm')}
          </div>
          <div className="text-gray-300">
            结束: {dayjs(task.endTime).format('YYYY-MM-DD HH:mm')}
          </div>
          <div className="text-gray-300">
            时长: {formatDuration(task.startTime, task.endTime)}
          </div>
          {task.hasConflict && (
            <div className="text-red-400 mt-1 font-medium">⚠ 存在时间冲突</div>
          )}
        </div>
      )}
    </>
  );
}
