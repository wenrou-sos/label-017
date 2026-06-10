import { useRef, useState, useEffect, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { GanttTask } from './types';
import { priorityColors, priorityGlowColors } from './types';
import { pixelToTime, snapToGrid } from '@/utils/gantt';
import scheduleApi from '@/api/scheduleApi';
import dayjs from 'dayjs';
import { Clock, Package } from 'lucide-react';

interface DraggableTaskProps {
  task: GanttTask;
  left: number;
  width: number;
  top: number;
  containerWidth: number;
  timelineStart: Date;
  timelineEnd: Date;
  isSelected: boolean;
  onSelect: (task: GanttTask) => void;
  onDrop: (taskId: string, startTime: Date, endTime: Date, machineId: number) => void;
  onConflictChange?: (taskId: string, hasConflict: boolean) => void;
  rowHeight: number;
  machineRows: { machineId: number }[];
}

export default function DraggableTask({
  task,
  left,
  width,
  top,
  containerWidth,
  timelineStart,
  timelineEnd,
  isSelected,
  onSelect,
  onDrop,
  onConflictChange,
  rowHeight,
  machineRows,
}: DraggableTaskProps) {
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [resizeStartTime, setResizeStartTime] = useState<Date | null>(null);
  const [resizeEndTime, setResizeEndTime] = useState<Date | null>(null);
  const [hasConflict, setHasConflict] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const resizeStartPos = useRef<number>(0);
  const originalTimes = useRef<{ start: Date; end: Date } | null>(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      type: 'gantt-task',
      task,
    },
  });

  const colors = priorityColors[task.priority];
  const glowColor = priorityGlowColors[task.priority];

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${left}%`,
    width: `${Math.max(width, 4)}%`,
    top,
    height: 'calc(100% - 8px)',
    marginTop: 4,
    minWidth: 40,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging || isResizing ? 100 : 1,
  };

  const checkConflict = useCallback(
    async (startTime: Date, endTime: Date, machineId: number) => {
      try {
        const result = await scheduleApi.checkConflict({
          scheduleId: task.scheduleId,
          machineId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        });
        return result.data.hasConflict;
      } catch {
        return false;
      }
    },
    [task.scheduleId]
  );

  useEffect(() => {
    if (isDragging && transform) {
      const currentX = (left / 100) * containerWidth + (transform?.x ?? 0);
      const newStartTime = snapToGrid(
        pixelToTime(currentX, containerWidth, timelineStart, timelineEnd),
        30
      );
      const duration = task.endTime.getTime() - task.startTime.getTime();
      const newEndTime = new Date(newStartTime.getTime() + duration);

      const currentY = top + (transform?.y ?? 0);
      const rowIndex = Math.max(0, Math.min(Math.floor(currentY / rowHeight), machineRows.length - 1));
      const machineId = machineRows[rowIndex]?.machineId ?? task.machineId;

      const timeout = setTimeout(async () => {
        const conflict = await checkConflict(newStartTime, newEndTime, machineId);
        setHasConflict(conflict);
        onConflictChange?.(task.id, conflict);
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [transform, isDragging, left, containerWidth, timelineStart, timelineEnd, task, rowHeight, machineRows, checkConflict, onConflictChange, top]);

  useEffect(() => {
    if (!isResizing || !resizeStartTime || !resizeEndTime) return;

    const timeout = setTimeout(async () => {
      const conflict = await checkConflict(resizeStartTime, resizeEndTime, task.machineId);
      setHasConflict(conflict);
      onConflictChange?.(task.id, conflict);
    }, 100);

    return () => clearTimeout(timeout);
  }, [resizeStartTime, resizeEndTime, isResizing, task.machineId, checkConflict, onConflictChange, task.id]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!originalTimes.current) return;

      const deltaX = e.clientX - resizeStartPos.current;
      const deltaTime = (deltaX / containerWidth) * (timelineEnd.getTime() - timelineStart.getTime());

      if (isResizing === 'left') {
        let newStart = new Date(originalTimes.current.start.getTime() + deltaTime);
        newStart = snapToGrid(newStart, 30);
        if (newStart >= originalTimes.current.end) {
          newStart = new Date(originalTimes.current.end.getTime() - 30 * 60 * 1000);
        }
        setResizeStartTime(newStart);
        setResizeEndTime(originalTimes.current.end);
      } else if (isResizing === 'right') {
        let newEnd = new Date(originalTimes.current.end.getTime() + deltaTime);
        newEnd = snapToGrid(newEnd, 30);
        if (newEnd <= originalTimes.current.start) {
          newEnd = new Date(originalTimes.current.start.getTime() + 30 * 60 * 1000);
        }
        setResizeStartTime(originalTimes.current.start);
        setResizeEndTime(newEnd);
      }
    };

    const handleMouseUp = () => {
      if (resizeStartTime && resizeEndTime) {
        onDrop(task.id, resizeStartTime, resizeEndTime, task.machineId);
      }
      setIsResizing(null);
      setResizeStartTime(null);
      setResizeEndTime(null);
      originalTimes.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, containerWidth, timelineStart, timelineEnd, task, onDrop, resizeStartTime, resizeEndTime]);

  const handleResizeStart = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(side);
    resizeStartPos.current = e.clientX;
    originalTimes.current = { start: task.startTime, end: task.endTime };
    setResizeStartTime(task.startTime);
    setResizeEndTime(task.endTime);
  };

  const formatDuration = (start: Date, end: Date) => {
    const hours = dayjs(end).diff(dayjs(start), 'hour', true);
    if (hours < 1) return `${Math.round(hours * 60)}分钟`;
    return `${Number(hours).toFixed(1)}小时`;
  };

  const displayStart = resizeStartTime || task.startTime;
  const displayEnd = resizeEndTime || task.endTime;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'rounded-md border cursor-move overflow-hidden transition-all duration-150 group',
          colors.bg,
          colors.border,
          colors.text,
          isSelected && `ring-2 ring-offset-1 shadow-lg ${glowColor}`,
          hasConflict && 'animate-pulse border-red-600 border-2',
          width < 4 && 'justify-center'
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(task);
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        {...listeners}
        {...attributes}
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 z-10"
          onMouseDown={(e) => handleResizeStart(e, 'left')}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 z-10"
          onMouseDown={(e) => handleResizeStart(e, 'right')}
        />

        <div className="px-2 py-1 h-full flex flex-col justify-center overflow-hidden">
          {width >= 8 && (
            <>
              <div className="flex items-center gap-1 text-xs font-medium truncate">
                <Package className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{task.orderNo}</span>
              </div>
              <div className="text-xs opacity-90 truncate mt-0.5">{task.productName}</div>
              <div className="flex items-center gap-1 text-xs opacity-80 mt-0.5">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span>{formatDuration(displayStart, displayEnd)}</span>
              </div>
            </>
          )}
          {width < 8 && width >= 5 && (
            <div className="text-xs font-medium text-center truncate">{task.orderNo}</div>
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
          <div className="text-gray-300">开始: {dayjs(displayStart).format('YYYY-MM-DD HH:mm')}</div>
          <div className="text-gray-300">结束: {dayjs(displayEnd).format('YYYY-MM-DD HH:mm')}</div>
          <div className="text-gray-300">时长: {formatDuration(displayStart, displayEnd)}</div>
          {hasConflict && <div className="text-red-400 mt-1 font-medium">⚠ 存在时间冲突</div>}
        </div>
      )}
    </>
  );
}
