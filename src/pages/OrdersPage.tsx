import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import Button from '@/components/Button';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import Loading from '@/components/Loading';
import { orderApi } from '@/api/orderApi';
import { productApi } from '@/api/productApi';
import type { Order, Product, CreateOrderRequest } from 'shared/types';
import { formatDate, formatDateTime } from '@/utils/datetime';
import { cn } from '@/lib/utils';

interface FormData {
  orderNo: string;
  productId: number | '';
  quantity: number | '';
  deliveryDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
}

const initialFormData: FormData = {
  orderNo: '',
  productId: '',
  quantity: '',
  deliveryDate: '',
  priority: 'medium',
  description: '',
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState<Order | null>(null);

  const estimatedHours = useMemo(() => {
    if (formData.productId && formData.quantity) {
      const product = products.find((p) => p.id === formData.productId);
      if (product) {
        return Number((Number(formData.quantity) * product.processHours).toFixed(2));
      }
    }
    return 0;
  }, [formData.productId, formData.quantity, products]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchSearch =
        !search ||
        order.orderNo.toLowerCase().includes(search.toLowerCase()) ||
        order.product?.productName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || order.status === statusFilter;
      const matchPriority = !priorityFilter || order.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [orders, search, statusFilter, priorityFilter]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersRes, productsRes] = await Promise.all([
          orderApi.getList({ page: 1, pageSize: 100 }),
          productApi.getList(),
        ]);
        setOrders(ordersRes.data.list);
        setProducts(productsRes.data);
        setPagination((prev) => ({ ...prev, total: ordersRes.data.total }));
      } catch (error) {
        console.error('获取订单数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!formData.productId || !formData.quantity || !formData.deliveryDate) {
      alert('请填写完整信息');
      return;
    }

    try {
      setFormLoading(true);
      const submitData: CreateOrderRequest = {
        orderNo: formData.orderNo || `ORD-${Date.now()}`,
        productId: Number(formData.productId),
        quantity: Number(formData.quantity),
        deliveryDate: formData.deliveryDate,
        priority: formData.priority,
        description: formData.description,
      };

      if (editingOrder) {
        await orderApi.update(editingOrder.id, submitData);
      } else {
        await orderApi.create(submitData);
      }

      const res = await orderApi.getList({ page: 1, pageSize: 100 });
      setOrders(res.data.list);
      setPagination((prev) => ({ ...prev, total: res.data.total }));
      handleCloseModal();
    } catch (error) {
      console.error('保存订单失败:', error);
      alert('保存失败，请重试');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (order: Order) => {
    try {
      await orderApi.remove(order.id);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('删除订单失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      orderNo: order.orderNo,
      productId: order.productId,
      quantity: order.quantity,
      deliveryDate: order.deliveryDate,
      priority: order.priority,
      description: order.description,
    });
    setModalOpen(true);
  };

  const handleSchedule = (order: Order) => {
    navigate(`/gantt?orderId=${order.id}`);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingOrder(null);
    setFormData(initialFormData);
  };

  const columns = [
    { key: 'orderNo', title: '订单号', width: 140 },
    {
      key: 'product',
      title: '产品',
      render: (_: unknown, record: Order) => record.product?.productName || '-',
    },
    { key: 'quantity', title: '数量', width: 80, align: 'right' as const },
    {
      key: 'estimatedHours',
      title: '预估工时',
      width: 100,
      align: 'right' as const,
      render: (value: number | string) => `${Number(value).toFixed(1)}h`,
    },
    {
      key: 'deliveryDate',
      title: '交付日期',
      width: 120,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (value: Order['status']) => <StatusBadge status={value} />,
    },
    {
      key: 'priority',
      title: '优先级',
      width: 80,
      render: (value: Order['priority']) => <StatusBadge status={value} />,
    },
    {
      key: 'createdAt',
      title: '创建时间',
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
    {
      key: 'actions',
      title: '操作',
      width: 180,
      render: (_: unknown, record: Order) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleSchedule(record);
            }}
          >
            排程
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record);
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirm(record);
            }}
          >
            <Trash2 className="w-4 h-4 text-danger" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ writingMode: 'horizontal-tb', direction: 'ltr' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
            <p className="text-gray-500 mt-1">管理生产订单及其排程状态</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新增订单
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索订单号或产品..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="scheduled">已排程</option>
              <option value="producing">生产中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
            >
              <option value="">全部优先级</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="urgent">紧急</option>
            </select>
          </div>
        </div>

        {loading ? (
          <Loading text="加载中..." />
        ) : (
          <Table
            columns={columns}
            data={filteredOrders}
            rowKey="id"
            pagination={{
              ...pagination,
              onChange: (current, pageSize) => setPagination({ ...pagination, current, pageSize }),
            }}
          />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editingOrder ? '编辑订单' : '新增订单'}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>
              取消
            </Button>
            <Button onClick={handleSubmit} loading={formLoading}>
              {editingOrder ? '保存' : '创建'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">订单号</label>
              <input
                type="text"
                value={formData.orderNo}
                onChange={(e) => setFormData({ ...formData, orderNo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                placeholder="自动生成或手动输入"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">优先级</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as FormData['priority'],
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">产品</label>
              <select
                value={formData.productId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    productId: e.target.value ? Number(e.target.value) : '',
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
              >
                <option value="">请选择产品</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.productCode} - {product.productName} ({product.processHours}h/{product.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">数量</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: e.target.value ? Number(e.target.value) : '',
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                placeholder="请输入数量"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                交付日期
              </label>
              <input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">预估工时</label>
              <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                {Number(estimatedHours).toFixed(2)} 小时
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none"
              placeholder="请输入备注信息..."
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="确认删除"
        width="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              取消
            </Button>
            <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              确认删除
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-4">
          <div className={cn('w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center flex-shrink-0')}>
            <AlertTriangle className="w-6 h-6 text-danger" />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">确定要删除这个订单吗？</p>
            <p className="text-gray-500 mt-1">
              订单号: <span className="font-mono">{deleteConfirm?.orderNo}</span>
            </p>
            <p className="text-sm text-gray-400 mt-2">此操作不可撤销</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
