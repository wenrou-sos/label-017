import { useState, useMemo } from 'react';
import { Search, Package, Clock, Calendar, AlertTriangle, GripVertical } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import type { Order } from 'shared/types';
import type { Priority } from './types';
import { priorityColors } from './types';
import StatusBadge from '@/components/StatusBadge';

interface UnscheduledOrdersPanelProps {
  orders: Order[];
  onOrderSelect?: (order: Order) => void;
  selectedOrderId?: number | null;
}

interface DraggableOrderCardProps {
  order: Order;
  onSelect?: (order: Order) => void;
  isSelected: boolean;
}

function DraggableOrderCard({ order, onSelect, isSelected }: DraggableOrderCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `order-${order.id}`,
    data: {
      type: 'unscheduled-order',
      order,
    },
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const colors = priorityColors[order.priority as Priority];
  const isDelayed = dayjs(order.deliveryDate).isBefore(dayjs());

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white rounded-lg border p-3 cursor-grab active:cursor-grabbing transition-all duration-200',
        isSelected ? `border-2 ${colors.border} shadow-md` : 'border-gray-200 hover:shadow-sm',
        isDelayed && 'border-l-4 border-l-red-500'
      )}
      onClick={() => onSelect?.(order)}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-800 truncate">{order.orderNo}</span>
            <StatusBadge status={order.priority} className="text-xs" />
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            <Package className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{order.product?.productName || '-'}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>{order.estimatedHours}h</span>
            </div>
            <div className={cn('flex items-center gap-1', isDelayed && 'text-red-500')}>
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>{dayjs(order.deliveryDate).format('MM/DD')}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>×{order.quantity}</span>
            </div>
          </div>
          {isDelayed && (
            <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span>已延期</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UnscheduledOrdersPanel({
  orders,
  onOrderSelect,
  selectedOrderId,
}: UnscheduledOrdersPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.product?.productName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [orders, searchQuery, priorityFilter]);

  const priorityOptions: Array<{ value: Priority | 'all'; label: string }> = [
    { value: 'all', label: '全部' },
    { value: 'urgent', label: '紧急' },
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200" style={{ width: 280 }}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">待排程订单</h3>
        <div className="relative mb-3">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索订单号或产品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {priorityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPriorityFilter(opt.value)}
              className={cn(
                'px-2 py-1 text-xs rounded-md transition-colors',
                priorityFilter === opt.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
        <span className="text-xs text-gray-500">共 {filteredOrders.length} 条</span>
        {filteredOrders.length > 0 && (
          <span className="text-xs text-gray-400">拖拽到甘特图排程</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Package className="w-12 h-12 mb-2 opacity-50" />
            <span className="text-sm">暂无待排程订单</span>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <DraggableOrderCard
              key={order.id}
              order={order}
              onSelect={onOrderSelect}
              isSelected={selectedOrderId === order.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
