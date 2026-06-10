import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Cpu, Settings } from 'lucide-react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import Loading from '@/components/Loading';
import { machineApi } from '@/api/machineApi';
import type { Machine } from 'shared/types';
import { cn } from '@/lib/utils';

interface FormData {
  machineCode: string;
  machineName: string;
  type: string;
  status: Machine['status'];
  capacity: number | '';
  description: string;
}

const initialFormData: FormData = {
  machineCode: '',
  machineName: '',
  type: '',
  status: 'idle',
  capacity: '',
  description: '',
};

const statusColors: Record<Machine['status'], string> = {
  running: 'bg-success',
  idle: 'bg-gray-400',
  maintenance: 'bg-warning',
  broken: 'bg-danger',
};

interface MachineCardProps {
  machine: Machine;
  onEdit: (machine: Machine) => void;
  onDelete: (machine: Machine) => void;
}

function MachineCard({ machine, onEdit, onDelete }: MachineCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Cpu className="w-6 h-6 text-primary" />
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(machine)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Edit2 className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => onDelete(machine)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-danger" />
            </button>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-1">{machine.machineName}</h3>
        <p className="text-sm text-gray-500 font-mono mb-3">{machine.machineCode}</p>

        <div className="flex items-center gap-2 mb-4">
          <StatusBadge status={machine.status} />
          <span className="text-sm text-gray-500">{machine.type}</span>
        </div>

        <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                statusColors[machine.status],
                machine.status === 'running' && 'animate-pulse'
              )}
            />
            <span className="text-sm text-gray-600">
              {machine.status === 'running' && '运行中'}
              {machine.status === 'idle' && '空闲'}
              {machine.status === 'maintenance' && '维护中'}
              {machine.status === 'broken' && '故障'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">产能: {machine.capacity}h/天</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Machine | null>(null);

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const res = await machineApi.getList();
      setMachines(res.data);
    } catch (error) {
      console.error('获取机器数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.machineName || !formData.machineCode || !formData.capacity) {
      alert('请填写完整信息');
      return;
    }

    try {
      setFormLoading(true);
      const submitData = {
        machineCode: formData.machineCode,
        machineName: formData.machineName,
        type: formData.type || '未分类',
        status: formData.status,
        capacity: Number(formData.capacity),
        description: formData.description,
      };

      if (editingMachine) {
        await machineApi.update(editingMachine.id, submitData);
      } else {
        await machineApi.create(submitData);
      }

      await fetchMachines();
      handleCloseModal();
    } catch (error) {
      console.error('保存机器失败:', error);
      alert('保存失败，请重试');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (machine: Machine) => {
    try {
      await machineApi.remove(machine.id);
      setMachines((prev) => prev.filter((m) => m.id !== machine.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('删除机器失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleEdit = (machine: Machine) => {
    setEditingMachine(machine);
    setFormData({
      machineCode: machine.machineCode,
      machineName: machine.machineName,
      type: machine.type,
      status: machine.status,
      capacity: machine.capacity,
      description: machine.description,
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingMachine(null);
    setFormData(initialFormData);
  };

  const stats = {
    total: machines.length,
    running: machines.filter((m) => m.status === 'running').length,
    idle: machines.filter((m) => m.status === 'idle').length,
    maintenance: machines.filter((m) => m.status === 'maintenance').length,
    broken: machines.filter((m) => m.status === 'broken').length,
  };

  return (
    <div style={{ writingMode: 'horizontal-tb', direction: 'ltr' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">机器管理</h1>
            <p className="text-gray-500 mt-1">管理生产机器及其状态</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新增机器
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">总机器数</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">运行中</p>
            <p className="text-2xl font-bold text-success mt-1">{stats.running}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">空闲</p>
            <p className="text-2xl font-bold text-gray-600 mt-1">{stats.idle}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">维护中</p>
            <p className="text-2xl font-bold text-warning mt-1">{stats.maintenance}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">故障</p>
            <p className="text-2xl font-bold text-danger mt-1">{stats.broken}</p>
          </div>
        </div>

        {loading ? (
          <Loading text="加载中..." />
        ) : machines.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Cpu className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">暂无机器数据</p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              添加第一台机器
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {machines.map((machine) => (
              <MachineCard
                key={machine.id}
                machine={machine}
                onEdit={handleEdit}
                onDelete={setDeleteConfirm}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editingMachine ? '编辑机器' : '新增机器'}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>
              取消
            </Button>
            <Button onClick={handleSubmit} loading={formLoading}>
              {editingMachine ? '保存' : '创建'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">机器编号</label>
              <input
                type="text"
                value={formData.machineCode}
                onChange={(e) => setFormData({ ...formData, machineCode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                placeholder="如: M-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">机器名称</label>
              <input
                type="text"
                value={formData.machineName}
                onChange={(e) => setFormData({ ...formData, machineName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                placeholder="如: 数控车床1号"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">机器类型</label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                placeholder="如: 车床、铣床、磨床"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">日产能 (小时)</label>
              <input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity: e.target.value ? Number(e.target.value) : '',
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                placeholder="如: 8"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as Machine['status'],
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
            >
              <option value="idle">空闲</option>
              <option value="running">运行中</option>
              <option value="maintenance">维护中</option>
              <option value="broken">故障</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none"
              placeholder="请输入机器描述信息..."
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
            <p className="text-lg font-medium text-gray-900">确定要删除这台机器吗？</p>
            <p className="text-gray-500 mt-1">
              机器: <span className="font-medium">{deleteConfirm?.machineName}</span> (
              <span className="font-mono">{deleteConfirm?.machineCode}</span>)
            </p>
            <p className="text-sm text-gray-400 mt-2">此操作不可撤销</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
