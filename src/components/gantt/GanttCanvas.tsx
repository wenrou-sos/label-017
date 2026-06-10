import { useRef, useEffect, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import type { GanttRow, GanttTask, DragState } from './types';
import GanttTaskBlock from './GanttTaskBlock';
import { calculateBarPosition, calculateGanttTimeRange, pixelToTime, snapToGrid, timeToPixel } from '@/utils/gantt';
import scheduleApi from '@/api/scheduleApi';

interface GanttCanvasProps {
  rows: GanttRow[];
  startDate: Date;
  endDate: Date;
  rowHeight: number;
  containerWidth: number;
  selectedTaskId: string | null;
  dragState: DragState;
  onTaskSelect: (task: GanttTask | null) => void;
  onDragStateChange: (state: Partial<DragState>) => void;
  onTaskUpdate: (taskId: string, startTime: Date, endTime: Date, machineId: number) => void;
}

export default function GanttCanvas({
  rows,
  startDate,
  endDate,
  rowHeight,
  containerWidth,
  selectedTaskId,
  dragState,
  onTaskSelect,
  onDragStateChange,
  onTaskUpdate,
}: GanttCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [currentTimeX, setCurrentTimeX] = useState(0);
  const [conflictTaskIds, setConflictTaskIds] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const x = timeToPixel(now, containerWidth, startDate, endDate);
      setCurrentTimeX(x);
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(interval);
  }, [containerWidth, startDate, endDate]);

  const checkConflict = useCallback(
    async (task: GanttTask, startTime: Date, endTime: Date, machineId: number) => {
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
    []
  );

  const handleDragStart = useCallback(
    (task: GanttTask, type: 'move' | 'resize-left' | 'resize-right', e: React.MouseEvent) => {
      e.preventDefault();
      onDragStateChange({
        isDragging: true,
        taskId: task.id,
        startTime: task.startTime,
        endTime: task.endTime,
        machineId: task.machineId,
        dragType: type,
      });
    },
    [onDragStateChange]
  );

  useEffect(() => {
    if (!dragState.isDragging) return;

    let conflictCheckTimeout: ReturnType<typeof setTimeout>;

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || !dragState.startTime || !dragState.endTime) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const newTime = snapToGrid(pixelToTime(mouseX, containerWidth, startDate, endDate), 30);

      const rowIndex = Math.floor((e.clientY - rect.top) / rowHeight);
      const newMachineId = rows[rowIndex]?.machineId ?? dragState.machineId;

      let newStartTime = dragState.startTime;
      let newEndTime = dragState.endTime;

      if (dragState.dragType === 'move') {
        const duration = dragState.endTime.getTime() - dragState.startTime.getTime();
        const centerOffset = duration / 2;
        newStartTime = new Date(newTime.getTime() - centerOffset);
        newEndTime = new Date(newTime.getTime() + centerOffset);
      } else if (dragState.dragType === 'resize-left') {
        newStartTime = newTime;
        if (newStartTime >= dragState.endTime) {
          newStartTime = new Date(dragState.endTime.getTime() - 30 * 60 * 1000);
        }
      } else if (dragState.dragType === 'resize-right') {
        newEndTime = newTime;
        if (newEndTime <= dragState.startTime) {
          newEndTime = new Date(dragState.startTime.getTime() + 30 * 60 * 1000);
        }
      }

      newStartTime = snapToGrid(newStartTime, 30);
      newEndTime = snapToGrid(newEndTime, 30);

      onDragStateChange({
        startTime: newStartTime,
        endTime: newEndTime,
        machineId: newMachineId,
      });

      clearTimeout(conflictCheckTimeout);
      conflictCheckTimeout = setTimeout(async () => {
        const task = rows.flatMap((r) => r.tasks).find((t) => t.id === dragState.taskId);
        if (task) {
          const hasConflict = await checkConflict(task, newStartTime, newEndTime, newMachineId!);
          setConflictTaskIds((prev) => {
            const next = new Set(prev);
            if (hasConflict) {
              next.add(task.id);
            } else {
              next.delete(task.id);
            }
            return next;
          });
        }
      }, 100);
    };

    const handleMouseUp = () => {
      if (dragState.taskId && dragState.startTime && dragState.endTime && dragState.machineId) {
        onTaskUpdate(dragState.taskId, dragState.startTime, dragState.endTime, dragState.machineId);
      }
      onDragStateChange({
        isDragging: false,
        taskId: null,
        startTime: null,
        endTime: null,
        machineId: null,
        dragType: null,
      });
      clearTimeout(conflictCheckTimeout);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      clearTimeout(conflictCheckTimeout);
    };
  }, [
    dragState,
    containerWidth,
    startDate,
    endDate,
    rowHeight,
    rows,
    onDragStateChange,
    onTaskUpdate,
    checkConflict,
  ]);

  const getTaskPosition = (task: GanttTask) => {
    if (dragState.isDragging && dragState.taskId === task.id && dragState.startTime && dragState.endTime) {
      return calculateBarPosition(dragState.startTime, dragState.endTime, startDate, endDate);
    }
    return calculateBarPosition(task.startTime, task.endTime, startDate, endDate);
  };

  const getTaskMachineIndex = (task: GanttTask) => {
    if (dragState.isDragging && dragState.taskId === task.id && dragState.machineId) {
      return rows.findIndex((r) => r.machineId === dragState.machineId);
    }
    return rows.findIndex((r) => r.machineId === task.machineId);
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden bg-white">
      <div
        ref={canvasRef}
        className="relative"
        style={{ width: containerWidth, minHeight: rows.length * rowHeight }}
        onClick={() => onTaskSelect(null)}
      >
        {dayRanges.map((range, idx) => {
          const isWeekend = dayjs(range.start).day() === 0 || dayjs(range.start).day() === 6;
          return (
            <div
              key={`bg-day-${idx}`}
              className={cn(
                'absolute top-0 bottom-0 border-r border-gray-100',
                isWeekend ? 'bg-gray-50' : 'bg-white'
              )}
              style={{
                left: `${range.left}%`,
                width: `${range.width}%`,
              }}
            />
          );
        })}

        {hourRanges.map((range, idx) => {
          const hour = dayjs(range.start).hour();
          const isNonWorkHour = hour < 8 || hour >= 20;
          return (
            <div
              key={`bg-hour-${idx}`}
              className={cn('absolute top-0 bottom-0 border-r border-gray-50', isNonWorkHour && 'bg-gray-100/50')}
              style={{
                left: `${range.left}%`,
                width: `${range.width}%`,
              }}
            />
          );
        })}

        {rows.map((row, rowIdx) => (
          <div
            key={`row-${row.machineId}`}
            className="absolute left-0 right-0 border-b border-gray-100"
            style={{
              top: rowIdx * rowHeight,
              height: rowHeight,
            }}
          />
        ))}

        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
          style={{
            left: currentTimeX,
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
          }}
        >
          <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
        </div>

        {rows.map((row) =>
          row.tasks.map((task) => {
            const position = getTaskPosition(task);
            const machineIdx = getTaskMachineIndex(task);
            if (machineIdx === -1) return null;

            const isDragging = dragState.isDragging && dragState.taskId === task.id;
            const hasConflict = conflictTaskIds.has(task.id) || task.hasConflict;

            return (
              <GanttTaskBlock
                key={task.id}
                task={{ ...task, hasConflict }}
                left={position.left}
                width={position.width}
                top={machineIdx * rowHeight}
                isSelected={selectedTaskId === task.id}
                isDragging={isDragging && dragState.dragType === 'move'}
                isResizing={isDragging && dragState.dragType !== 'move'}
                onSelect={onTaskSelect}
                onDragStart={handleDragStart}
                containerWidth={containerWidth}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
