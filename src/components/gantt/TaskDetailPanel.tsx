import { useState, useEffect } from 'react';
import { X, Package, Cpu, Clock, Calendar, AlertTriangle, Trash2, Save } from 'lucide-react';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import { Button } from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import type { GanttTask } from './types';
import { priorityColors } from './types';
import type { ConflictInfo } from 'shared/types';
import scheduleApi from '@/api/scheduleApi';

interface TaskDetailPanelProps {
  task: GanttTask | null;
  onClose: () => void;
  onUpdate: (taskId: string, startTime: Date, endTime: Date) => void;
  onDelete: (taskId: string) => void;
  machineName?: string;
  productName?: string;
}

export default function TaskDetailPanel({
  task,
  onClose,
  onUpdate,
  onDelete,
  machineName,
  productName,
}: TaskDetailPanelProps) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (task) {
      setStartTime(dayjs(task.startTime).format('YYYY-MM-DDTHH:mm'));
      setEndTime(dayjs(task.endTime).format('YYYY-MM-DDTHH:mm'));
      setConflictInfo(null);
      setHasChanges(false);
    }
  }, [task]);

  useEffect(() => {
    if (!task) return;

    const checkConflict = async () => {
      try {
        const result = await scheduleApi.checkConflict({
          scheduleId: task.scheduleId,
          machineId: task.machineId,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        });
        setConflictInfo(result.data);
      } catch {
        setConflictInfo(null);
      }
    };

    if (startTime && endTime && hasChanges) {
      const timeout = setTimeout(checkConflict, 500);
      return () => clearTimeout(timeout);
    }
  }, [startTime, endTime, task, hasChanges]);

  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartTime(value);
    } else {
      setEndTime(value);
    }
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!task) return;
    setIsLoading(true);
    try {
      await onUpdate(task.id, new Date(startTime), new Date(endTime));
      setHasChanges(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!task) return;
    if (confirm('确定要删除此排程吗？')) {
      onDelete(task.id);
    }
  };

  const formatDuration = () => {
    if (!startTime || !endTime) return '';
    const hours = dayjs(endTime).diff(dayjs(startTime), 'hour', true);
    if (hours < 1) return `${Math.round(hours * 60)} 分钟`;
    return `${Number(hours).toFixed(1)} 小时`;
  };

  if (!task) {
    return (
      <div
        className="flex flex-col h-full bg-white border-l border-gray-200"
        style={{ width: 320 }}
      >
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6">
          <Clock className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-sm">选择一个任务查看详情</p>
        </div>
      </div>
    );
  }

  const colors = priorityColors[task.priority];

  return (
    <div
      className="flex flex-col h-full bg-white border-l border-gray-200"
      style={{ width: 320 }}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800">任务详情</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className={cn('p-3 rounded-lg', colors.bg, colors.text)}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{task.orderNo}</span>
            <StatusBadge status={task.priority} />
          </div>
          <div className="text-xs opacity-90">{productName || task.productName}</div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-gray-500 text-xs">订单号</div>
              <div className="text-gray-800 font-medium">{task.orderNo}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Cpu className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-gray-500 text-xs">生产机器</div>
              <div className="text-gray-800 font-medium">{machineName || '未知'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-gray-500 text-xs">产品名称</div>
              <div className="text-gray-800 font-medium">{productName || task.productName}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <StatusBadge status={task.status} />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-xs font-medium text-gray-500 mb-3">时间调整</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">开始时间</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => handleTimeChange('start', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>时长: {formatDuration()}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">结束时间</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => handleTimeChange('end', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {conflictInfo && conflictInfo.hasConflict && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">时间冲突</span>
            </div>
            <div className="space-y-2">
              {conflictInfo.conflicts.map((conflict, idx) => (
                <div key={idx} className="text-xs text-red-600">
                  <div className="font-medium">{conflict.orderNo}</div>
                  <div className="text-red-500">
                    {dayjs(conflict.startTime).format('MM-DD HH:mm')} - {dayjs(conflict.endTime).format('HH:mm')}
                    <span className="ml-2">重叠 {conflict.overlapMinutes} 分钟</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 space-y-2">
        <Button
          fullWidth
          variant="primary"
          onClick={handleSave}
          loading={isLoading}
          disabled={!hasChanges || conflictInfo?.hasConflict}
        >
          <Save className="w-4 h-4 mr-2" />
          保存修改
        </Button>
        <Button fullWidth variant="danger" onClick={handleDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          删除排程
        </Button>
      </div>
    </div>
  );
}
