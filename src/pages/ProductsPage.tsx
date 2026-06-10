import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Package, Clock } from 'lucide-react';
import Button from '@/components/Button';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import Loading from '@/components/Loading';
import { productApi } from '@/api/productApi';
import type { Product } from 'shared/types';
import { formatDateTime } from '@/utils/datetime';

interface FormData {
  productCode: string;
  productName: string;
  processHours: number | '';
  unit: string;
  description: string;
}

const initialFormData: FormData = {
  productCode: '',
  productName: '',
  processHours: '',
  unit: '件',
  description: '',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [search, setSearch] = useState('');

  const filteredProducts = products.filter(
    (p) =>
      !search ||
      p.productCode.toLowerCase().includes(search.toLowerCase()) ||
      p.productName.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productApi.getList();
      setProducts(res.data);
    } catch (error) {
      console.error('获取产品数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.productCode || !formData.productName || !formData.processHours) {
      alert('请填写完整信息');
      return;
    }

    try {
      setFormLoading(true);
      const submitData = {
        productCode: formData.productCode,
        productName: formData.productName,
        processHours: Number(formData.processHours),
        unit: formData.unit || '件',
        description: formData.description,
      };

      if (editingProduct) {
        await productApi.update(editingProduct.id, submitData);
      } else {
        await productApi.create(submitData);
      }

      await fetchProducts();
      handleCloseModal();
    } catch (error) {
      console.error('保存产品失败:', error);
      alert('保存失败，请重试');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (product: Product) => {
    try {
      await productApi.remove(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('删除产品失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      productCode: product.productCode,
      productName: product.productName,
      processHours: product.processHours,
      unit: product.unit,
      description: product.description,
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setFormData(initialFormData);
  };

  const columns = [
    { key: 'productCode', title: '产品编码', width: 140 },
    { key: 'productName', title: '产品名称' },
    {
      key: 'processHours',
      title: '单位工时',
      width: 120,
      align: 'right' as const,
      render: (value: number | string) => (
        <div className="flex items-center justify-end gap-1">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>{Number(value).toFixed(2)} h</span>
        </div>
      ),
    },
    { key: 'unit', title: '单位', width: 80, align: 'center' as const },
    { key: 'description', title: '描述' },
    {
      key: 'createdAt',
      title: '创建时间',
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
    {
      key: 'actions',
      title: '操作',
      width: 120,
      render: (_: unknown, record: Product) => (
        <div className="flex items-center gap-1">
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
            <h1 className="text-2xl font-bold text-gray-900">产品工时配置</h1>
            <p className="text-gray-500 mt-1">管理产品及其标准加工工时</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新增产品
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索产品编码或名称..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                />
              </div>
            </div>
            <div className="text-sm text-gray-500">
              共 <span className="font-semibold text-gray-900">{products.length}</span> 个产品
            </div>
          </div>
        </div>

        {loading ? (
          <Loading text="加载中..." />
        ) : (
          <Table columns={columns} data={filteredProducts} rowKey="id" />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? '编辑产品' : '新增产品'}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>
              取消
            </Button>
            <Button onClick={handleSubmit} loading={formLoading}>
              {editingProduct ? '保存' : '创建'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">产品编码</label>
              <input
                type="text"
                value={formData.productCode}
                onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                placeholder="如: P-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">产品名称</label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                placeholder="如: 精密齿轮"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">单位工时 (小时)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.processHours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    processHours: e.target.value ? Number(e.target.value) : '',
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                placeholder="如: 2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">计量单位</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                placeholder="如: 件、个、套"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">产品描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none"
              placeholder="请输入产品描述信息..."
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
          <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-6 h-6 text-danger" />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">确定要删除这个产品吗？</p>
            <p className="text-gray-500 mt-1">
              产品: <span className="font-medium">{deleteConfirm?.productName}</span> (
              <span className="font-mono">{deleteConfirm?.productCode}</span>)
            </p>
            <p className="text-sm text-gray-400 mt-2">此操作不可撤销</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
