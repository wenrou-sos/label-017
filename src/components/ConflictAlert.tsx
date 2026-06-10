import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConflictInfo } from 'shared/types';
import { formatDateTime } from '@/utils/datetime';

export interface ConflictAlertProps {
  conflictInfo: ConflictInfo | null;
  onClose?: () => void;
  className?: string;
}

export default function ConflictAlert({
  conflictInfo,
  onClose,
  className,
}: ConflictAlertProps) {
  if (!conflictInfo || !conflictInfo.hasConflict) return null;

  return (
    <div
      className={cn(
        'bg-danger/10 border border-danger/30 rounded-lg p-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-danger">
              检测到排程冲突
            </h4>
            {onClose && (
              <button
                type="button"
                className="p-0.5 rounded hover:bg-danger/20 text-danger transition-colors"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-danger/80">
            当前排程与以下 {conflictInfo.conflicts.length} 个排程存在时间冲突：
          </p>
          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
            {conflictInfo.conflicts.map((conflict, index) => (
              <div
                key={index}
                className="bg-white/50 rounded p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {conflict.orderNo} - {conflict.productName}
                  </span>
                  <span className="text-danger text-xs">
                    重叠 {conflict.overlapMinutes} 分钟
                  </span>
                </div>
                <div className="mt-1 text-gray-600 text-xs">
                  {formatDateTime(conflict.startTime)} ~ {formatDateTime(conflict.endTime)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
