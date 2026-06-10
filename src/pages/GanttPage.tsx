import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import {
  Calendar,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Cpu,
  Trash2,
  GripVertical,
  AlertTriangle,
  Camera,
  Download,
} from 'lucide-react';
import dayjs from 'dayjs';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import Loading from '@/components/Loading';
import ConflictAlert from '@/components/ConflictAlert';
import { orderApi } from '@/api/orderApi';
import { machineApi } from '@/api/machineApi';
import { useScheduleStore } from '@/store/useScheduleStore';
import type { Order, Machine, Schedule } from 'shared/types';
import { formatDateTime, formatDate, getDurationText } from '@/utils/datetime';
import {
  calculateGanttTimeRange,
  calculateBarPosition,
  getTimelineRange,
  pixelToTime,
  snapToGrid,
} from '@/utils/gantt';
import { cn } from '@/lib/utils';
// @ts-ignore
import html2canvas from 'html2canvas';

interface DraggedOrder {
  id: string;
  type: 'order' | 'schedule';
  orderId: number;
  estimatedHours: number;
  orderNo: string;
  productName: string;
}

export default function GanttPage() {
  const [searchParams] = useSearchParams();
  const selectedOrderId = searchParams.get('orderId');
  const ganttRef = useRef<HTMLDivElement>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'day' | 'hour'>('hour');
  const [zoom, setZoom] = useState(1);
  const [baseDate, setBaseDate] = useState(dayjs());
  const [draggedItem, setDraggedItem] = useState<DraggedOrder | null>(null);
  const [dragPosition, setDragPosition] = useState<{ machineId: number; startTime: Date } | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [resizing, setResizing] = useState<{ id: number; startX: number; initialWidth: number; initialLeft: number } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const {
    schedules,
    conflictInfo,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    checkConflict,
    clearConflict,
  } = useScheduleStore();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } })
  );

  const timelineRange = useMemo(() => {
    const days = viewMode === 'day' ? 14 : 3;
    return getTimelineRange(baseDate.toDate(), days);
  }, [baseDate, viewMode]);

  const timeRanges = useMemo(() => {
    return calculateGanttTimeRange({
      startDate: timelineRange.start,
      endDate: timelineRange.end,
      columnWidth: 100,
      unit: viewMode,
    });
  }, [timelineRange, viewMode]);

  const pendingOrders = useMemo(() => {
    const scheduledOrderIds = new Set((schedules || []).map((s) => s.orderId));
    return (orders || []).filter((o) => o.status === 'pending' && !scheduledOrderIds.has(o.id));
  }, [orders, schedules]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersRes, machinesRes] = await Promise.all([
          orderApi.getList({ page: 1, pageSize: 100 }),
          machineApi.getList(),
        ]);
        setOrders(ordersRes.data.list);
        setMachines(machinesRes.data);
        await fetchSchedules({
          startDate: timelineRange.start.toISOString(),
          endDate: timelineRange.end.toISOString(),
        });
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timelineRange, fetchSchedules]);

  useEffect(() => {
    if (selectedOrderId) {
      const order = orders.find((o) => o.id === Number(selectedOrderId));
      if (order) {
        // 高亮显示该订单
      }
    }
  }, [selectedOrderId, orders]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as DraggedOrder;
    if (data) {
      setDraggedItem(data);
      clearConflict();
    }
  };

  const handleDragMove = async (event: any) => {
    if (!draggedItem || !ganttRef.current) return;

    const rect = ganttRef.current.getBoundingClientRect();
    const x = event.activatorEvent.clientX - rect.left;
    const y = event.activatorEvent.clientY - rect.top;

    const rowHeight = 60;
    const headerHeight = 80;
    const machineIndex = Math.floor((y - headerHeight) / rowHeight);

    if (machineIndex < 0 || machineIndex >= machines.length) {
      setDragPosition(null);
      return;
    }

    const machine = machines[machineIndex];
    const startTime = snapToGrid(pixelToTime(x, rect.width, timelineRange.start, timelineRange.end), 15);

    setDragPosition({ machineId: machine.id, startTime });

    const endTime = new Date(startTime.getTime() + draggedItem.estimatedHours * 60 * 60 * 1000);

    try {
      await checkConflict({
        machineId: machine.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
    } catch {
      // 错误已在 store 中处理
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!draggedItem || !dragPosition) {
      setDraggedItem(null);
      setDragPosition(null);
      clearConflict();
      return;
    }

    const endTime = new Date(
      dragPosition.startTime.getTime() + draggedItem.estimatedHours * 60 * 60 * 1000
    );

    if (conflictInfo?.hasConflict) {
      alert('存在排程冲突，请调整时间');
      setDraggedItem(null);
      setDragPosition(null);
      clearConflict();
      return;
    }

    try {
      if (draggedItem.type === 'schedule') {
        await updateSchedule(Number(draggedItem.id), {
          machineId: dragPosition.machineId,
          startTime: dragPosition.startTime.toISOString(),
          endTime: endTime.toISOString(),
        });
      } else {
        await createSchedule({
          orderId: draggedItem.orderId,
          machineId: dragPosition.machineId,
          startTime: dragPosition.startTime.toISOString(),
          endTime: endTime.toISOString(),
        });
        await orderApi.updateStatus(draggedItem.orderId, 'scheduled');
        const res = await orderApi.getList({ page: 1, pageSize: 100 });
        setOrders(res.data.list);
      }
    } catch (error) {
      console.error('创建/更新排程失败:', error);
      alert('操作失败，请重试');
    } finally {
      setDraggedItem(null);
      setDragPosition(null);
      clearConflict();
    }
  };

  const handleExportImage = async () => {
    if (!ganttRef.current || isExporting) return;

    try {
      setIsExporting(true);
      setExportSuccess(false);

      const container = ganttRef.current;
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `生产排程_${dayjs().format('YYYY-MM-DD_HH-mm')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('导出图片失败:', error);
      alert('导出图片失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const handleResizeStart = (e: React.MouseEvent, schedule: Schedule, direction: 'left' | 'right') => {
    e.stopPropagation();
    if (!ganttRef.current) return;

    const rect = ganttRef.current.getBoundingClientRect();
    const bar = calculateBarPosition(schedule.startTime, schedule.endTime, timelineRange.start, timelineRange.end);

    setResizing({
      id: schedule.id,
      startX: e.clientX,
      initialWidth: (bar.width / 100) * rect.width,
      initialLeft: (bar.left / 100) * rect.width,
    });

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizing || !ganttRef.current) return;

    const rect = ganttRef.current.getBoundingClientRect();
    const schedule = schedules.find((s) => s.id === resizing.id);
    if (!schedule) return;

    const deltaX = e.clientX - resizing.startX;
    const newWidth = Math.max(30, resizing.initialWidth + deltaX);

    const newEndTime = pixelToTime(resizing.initialLeft + newWidth, rect.width, timelineRange.start, timelineRange.end);
    const snappedEndTime = snapToGrid(newEndTime, 15);

    const scheduleEl = document.querySelector(`[data-schedule-id="${schedule.id}"]`);
    if (scheduleEl) {
      const newLeft = ((resizing.initialLeft) / rect.width) * 100;
      const newWidthPercent = (newWidth / rect.width) * 100;
      (scheduleEl as HTMLElement).style.left = `${newLeft}%`;
      (scheduleEl as HTMLElement).style.width = `${newWidthPercent}%`;
    }
  };

  const handleResizeEnd = async () => {
    if (!resizing || !ganttRef.current) return;

    const schedule = schedules.find((s) => s.id === resizing.id);
    if (!schedule) return;

    const rect = ganttRef.current.getBoundingClientRect();
    const scheduleEl = document.querySelector(`[data-schedule-id="${schedule.id}"]`) as HTMLElement;

    if (scheduleEl) {
      const leftPercent = parseFloat(scheduleEl.style.left);
      const widthPercent = parseFloat(scheduleEl.style.width);

      const newStartTime = pixelToTime((leftPercent / 100) * rect.width, rect.width, timelineRange.start, timelineRange.end);
      const newEndTime = pixelToTime(((leftPercent + widthPercent) / 100) * rect.width, rect.width, timelineRange.start, timelineRange.end);

      const snappedStart = snapToGrid(newStartTime, 15);
      const snappedEnd = snapToGrid(newEndTime, 15);

      try {
        await checkConflict({
          scheduleId: schedule.id,
          machineId: schedule.machineId,
          startTime: snappedStart.toISOString(),
          endTime: snappedEnd.toISOString(),
        });

        if (conflictInfo?.hasConflict) {
          alert('存在排程冲突，请调整');
          const bar = calculateBarPosition(schedule.startTime, schedule.endTime, timelineRange.start, timelineRange.end);
          scheduleEl.style.left = `${bar.left}%`;
          scheduleEl.style.width = `${bar.width}%`;
        } else {
          await updateSchedule(schedule.id, {
            startTime: snappedStart.toISOString(),
            endTime: snappedEnd.toISOString(),
          });
        }
      } catch (error) {
        console.error('更新排程失败:', error);
      } finally {
        scheduleEl.style.left = '';
        scheduleEl.style.width = '';
      }
    }

    setResizing(null);
    clearConflict();
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  const handleDeleteSchedule = async (schedule: Schedule) => {
    if (!confirm('确定要删除这个排程吗？')) return;

    try {
      await deleteSchedule(schedule.id);
      await orderApi.updateStatus(schedule.orderId, 'pending');
      const res = await orderApi.getList({ page: 1, pageSize: 100 });
      setOrders(res.data.list);
      setSelectedSchedule(null);
    } catch (error) {
      console.error('删除排程失败:', error);
      alert('删除失败，请重试');
    }
  };

  const rowHeight = 60;
  const headerHeight = 80;

  if (loading) {
    return (
      <Loading fullScreen text="加载甘特图..." />
    );
  }

  return (
    <div 
      className="h-[calc(100vh-120px)] flex flex-col gap-4"
      style={{ writingMode: 'horizontal-tb', direction: 'ltr' }}
    >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">甘特图排程</h1>
            <p className="text-gray-500 mt-1">拖拽订单到时间轴进行排程</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm p-1">
              <Button
                size="sm"
                variant={viewMode === 'hour' ? 'primary' : 'ghost'}
                onClick={() => setViewMode('hour')}
              >
                小时
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'day' ? 'primary' : 'ghost'}
                onClick={() => setViewMode('day')}
              >
                日
              </Button>
            </div>
            <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm p-1">
              <Button size="sm" variant="ghost" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="px-2 text-sm text-gray-600">{Math.round(zoom * 100)}%</span>
              <Button size="sm" variant="ghost" onClick={() => setZoom(Math.min(2, zoom + 0.25))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm p-1">
              <Button size="sm" variant="ghost" onClick={() => setBaseDate((d) => d.subtract(1, viewMode === 'day' ? 'week' : 'day'))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 text-sm font-medium">
                {formatDate(timelineRange.start)} - {formatDate(timelineRange.end)}
              </span>
              <Button size="sm" variant="ghost" onClick={() => setBaseDate((d) => d.add(1, viewMode === 'day' ? 'week' : 'day'))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm p-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleExportImage}
                disabled={isExporting}
                title="导出为图片"
              >
                {isExporting ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                ) : exportSuccess ? (
                  <Download className="w-4 h-4 text-green-500" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {conflictInfo?.hasConflict && (
          <ConflictAlert conflictInfo={conflictInfo} onClose={clearConflict} />
        )}

        {exportSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <Download className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-medium text-green-800">导出成功！</p>
              <p className="text-sm text-green-600">图片已下载，可用于周报或车间看板</p>
            </div>
          </div>
        )}

        <div className="flex-1 flex gap-4 min-h-0">
          <div className="w-64 bg-white rounded-lg shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">待排程订单</h3>
              <p className="text-xs text-gray-500 mt-1">拖拽到右侧进行排程</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {pendingOrders.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">暂无待排程订单</p>
              ) : (
                <div className="space-y-2">
                  {pendingOrders.map((order) => (
                    <div
                      key={`order-${order.id}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        const data: DraggedOrder = {
                          id: `order-${order.id}`,
                          type: 'order',
                          orderId: order.id,
                          estimatedHours: order.estimatedHours,
                          orderNo: order.orderNo,
                          productName: order.product?.productName || '',
                        };
                        setDraggedItem(data);
                      }}
                      onDragEnd={() => {
                        setDraggedItem(null);
                        setDragPosition(null);
                      }}
                      onDrop={(e) => e.preventDefault()}
                      className={cn(
                        'p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-grab active:cursor-grabbing hover:border-primary hover:bg-primary/5 transition-all group',
                        selectedOrderId === String(order.id) && 'ring-2 ring-primary border-primary bg-primary/5'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-primary mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 text-sm">{order.orderNo}</span>
                            <StatusBadge status={order.priority} className="text-xs" />
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 truncate">
                            {order.product?.productName} × {order.quantity}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{Number(order.estimatedHours).toFixed(1)}h</span>
                            <Calendar className="w-3 h-3 ml-2" />
                            <span>{formatDate(order.deliveryDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            <div
              ref={ganttRef}
              className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden relative"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: `${100 / zoom}%`, height: `${100 / zoom}%` }}
            >
              <div className="sticky top-0 z-20 bg-white border-b border-gray-200" style={{ height: headerHeight }}>
                <div className="h-full flex">
                  <div className="w-32 flex-shrink-0 border-r border-gray-200 p-2 flex items-center">
                    <span className="text-sm font-medium text-gray-700">机器</span>
                  </div>
                  <div className="flex-1 relative overflow-hidden">
                    <div className="absolute inset-0 flex">
                      {timeRanges.map((range, index) => (
                        <div
                          key={index}
                          className="flex-shrink-0 border-r border-gray-200 p-2 text-center"
                          style={{ width: `${range.width}%` }}
                        >
                          <div className="text-xs text-gray-500">{range.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-auto" style={{ height: `calc(100% - ${headerHeight}px)` }}>
                {machines.map((machine, machineIndex) => (
                  <div key={machine.id} className="flex border-b border-gray-100" style={{ height: rowHeight }}>
                    <div className="w-32 flex-shrink-0 border-r border-gray-200 p-2 flex items-center bg-gray-50">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            machine.status === 'running' && 'bg-success',
                            machine.status === 'idle' && 'bg-gray-400',
                            machine.status === 'maintenance' && 'bg-warning',
                            machine.status === 'broken' && 'bg-danger'
                          )}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{machine.machineName}</div>
                          <div className="text-xs text-gray-500 truncate">{machine.machineCode}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 relative">
                      <div className="absolute inset-0 flex">
                        {timeRanges.map((range, index) => (
                          <div
                            key={index}
                            className={cn(
                              'flex-shrink-0 border-r border-gray-100',
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                            )}
                            style={{ width: `${range.width}%` }}
                          />
                        ))}
                      </div>

                      {schedules
                        .filter((s) => s.machineId === machine.id)
                        .map((schedule) => {
                          const position = calculateBarPosition(
                            schedule.startTime,
                            schedule.endTime,
                            timelineRange.start,
                            timelineRange.end
                          );

                          const hasConflict = conflictInfo?.conflicts.some(
                            (c) => c.scheduleId === schedule.id
                          );

                          return (
                            <div
                              key={schedule.id}
                              data-schedule-id={schedule.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.effectAllowed = 'move';
                                const data: DraggedOrder = {
                                  id: String(schedule.id),
                                  type: 'schedule',
                                  orderId: schedule.orderId,
                                  estimatedHours: schedule.actualHours,
                                  orderNo: schedule.order?.orderNo || '',
                                  productName: schedule.order?.product?.productName || '',
                                };
                                setDraggedItem(data);
                              }}
                              onDragEnd={() => {
                                setDraggedItem(null);
                                setDragPosition(null);
                              }}
                              onDrop={(e) => e.preventDefault()}
                              className={cn(
                                'absolute top-2 bottom-2 rounded-lg px-2 py-1 cursor-move overflow-hidden group',
                                'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm',
                                'hover:from-primary-600 hover:to-primary-700 transition-all',
                                hasConflict && 'from-danger to-danger/80 ring-2 ring-danger/50'
                              )}
                              style={{
                                left: `${position.left}%`,
                                width: `${position.width}%`,
                              }}
                              onClick={() => setSelectedSchedule(schedule)}
                            >
                              <div className="h-full flex flex-col justify-center">
                                <div className="text-xs font-medium truncate">
                                  {schedule.order?.orderNo}
                                </div>
                                <div className="text-xs opacity-80 truncate">
                                  {schedule.order?.product?.productName}
                                </div>
                              </div>
                              <div
                                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-l-lg"
                                onMouseDown={(e) => handleResizeStart(e, schedule, 'left')}
                              />
                              <div
                                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-r-lg"
                                onMouseDown={(e) => handleResizeStart(e, schedule, 'right')}
                              />
                              {hasConflict && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-danger text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                                  冲突
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>

              {dragPosition && draggedItem && (
                <div
                  className={cn(
                    'absolute rounded-lg px-2 py-1 pointer-events-none opacity-80',
                    conflictInfo?.hasConflict ? 'bg-danger/50' : 'bg-primary/50'
                  )}
                  style={{
                    left: `${calculateBarPosition(
                      dragPosition.startTime,
                      new Date(dragPosition.startTime.getTime() + draggedItem.estimatedHours * 60 * 60 * 1000),
                      timelineRange.start,
                      timelineRange.end
                    ).left}%`,
                    top: `${headerHeight + machines.findIndex((m) => m.id === dragPosition.machineId) * rowHeight + 8}px`,
                    width: `${calculateBarPosition(
                      dragPosition.startTime,
                      new Date(dragPosition.startTime.getTime() + draggedItem.estimatedHours * 60 * 60 * 1000),
                      timelineRange.start,
                      timelineRange.end
                    ).width}%`,
                    height: `${rowHeight - 16}px`,
                  }}
                >
                  <div className="text-white text-xs font-medium truncate">{draggedItem.orderNo}</div>
                </div>
              )}
            </div>

            <DragOverlay>
              {draggedItem ? (
                <div className="bg-primary text-white px-3 py-2 rounded-lg shadow-lg opacity-90">
                  <div className="text-sm font-medium">{draggedItem.orderNo}</div>
                  <div className="text-xs opacity-80">{draggedItem.productName}</div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {selectedSchedule && (
            <div className="w-72 bg-white rounded-lg shadow-sm flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">排程详情</h3>
                <button onClick={() => setSelectedSchedule(null)} className="text-gray-400 hover:text-gray-600">
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className="text-xs text-gray-500">订单号</label>
                  <p className="font-mono font-medium text-gray-900">{selectedSchedule.order?.orderNo}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">产品</label>
                  <p className="font-medium text-gray-900">{selectedSchedule.order?.product?.productName}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">数量</label>
                  <p className="font-medium text-gray-900">{selectedSchedule.order?.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-gray-400" />
                  <div>
                    <label className="text-xs text-gray-500">机器</label>
                    <p className="font-medium text-gray-900">{selectedSchedule.machine?.machineName}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">开始时间</label>
                  <p className="font-medium text-gray-900">{formatDateTime(selectedSchedule.startTime)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">结束时间</label>
                  <p className="font-medium text-gray-900">{formatDateTime(selectedSchedule.endTime)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">工期</label>
                  <p className="font-medium text-gray-900">
                    {getDurationText(selectedSchedule.startTime, selectedSchedule.endTime)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">状态</label>
                  <div className="mt-1">
                    <StatusBadge status={selectedSchedule.status} />
                  </div>
                </div>
                {selectedSchedule.order && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <label className="text-xs text-gray-500">优先级</label>
                      <div className="mt-0.5">
                        <StatusBadge status={selectedSchedule.order.priority} />
                      </div>
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-200">
                  <Button variant="danger" fullWidth onClick={() => handleDeleteSchedule(selectedSchedule)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除排程
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
