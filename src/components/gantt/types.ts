import type { Schedule, Order, Machine } from 'shared/types';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type ViewMode = 'day' | 'week';

export interface GanttTask {
  id: string;
  scheduleId: number;
  orderId: number;
  orderNo: string;
  productName: string;
  startTime: Date;
  endTime: Date;
  priority: Priority;
  machineId: number;
  status: Schedule['status'];
  hasConflict?: boolean;
}

export interface GanttRow {
  machineId: number;
  machineName: string;
  machineCode: string;
  status: Machine['status'];
  loadRate: number;
  tasks: GanttTask[];
}

export interface TimeScale {
  start: Date;
  end: Date;
  unit: 'day' | 'hour';
  snapMinutes: number;
}

export interface DragState {
  isDragging: boolean;
  taskId: string | null;
  startTime: Date | null;
  endTime: Date | null;
  machineId: number | null;
  dragType: 'move' | 'resize-left' | 'resize-right' | null;
}

export const priorityColors: Record<Priority, { bg: string; border: string; text: string }> = {
  urgent: { bg: 'bg-red-500', border: 'border-red-600', text: 'text-white' },
  high: { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-white' },
  medium: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white' },
  low: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white' },
};

export const priorityGlowColors: Record<Priority, string> = {
  urgent: 'shadow-red-500/50',
  high: 'shadow-orange-500/50',
  medium: 'shadow-blue-500/50',
  low: 'shadow-green-500/50',
};
