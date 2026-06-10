import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Users, Key, Shield } from 'lucide-react';
import Button from '@/components/Button';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import Loading from '@/components/Loading';
import { userApi } from '@/api/userApi';
import type { User } from 'shared/types';
import { formatDateTime } from '@/utils/datetime';

interface FormData {
  username: string;
  realName: string;
  password: string;
  role: User['role'];
  status: User['status'];
}

const initialFormData: FormData = {
  username: '',
  realName: '',
  password: '',
  role: 'planner',
  status: 'active',
};

const roleLabels: Record<User['role'], { label: string; className: string }> = {
  admin: { label: '管理员', className: 'bg-danger/10 text-danger' },
  planner: { label: '计划员', className: 'bg-primary/10 text-primary' },
  viewer: { label: '查看者', className: 'bg-gray-100 text-gray-700' },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [newPassword, setNewPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userApi.getList();
      setUsers(res.data);
    } catch (error) {
      console.error('获取用户数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.username || !formData.realName) {
      alert('请填写完整信息');
      return;
    }
    if (!editingUser && !formData.password) {
      alert('请设置初始密码');
      return;
    }

    try {
      setFormLoading(true);
      const submitData = {
        username: formData.username,
        realName: formData.realName,
        role: formData.role,
        status: formData.status,
        ...(formData.password ? { password: formData.password } : {}),
      };

      if (editingUser) {
        await userApi.update(editingUser.id, submitData);
      } else {
        await userApi.create(submitData as any);
      }

      await fetchUsers();
      handleCloseModal();
    } catch (error) {
      console.error('保存用户失败:', error);
      alert('保存失败，请重试');
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert('密码长度至少6位');
      return;
    }
    if (!resetUser) return;

    try {
      setFormLoading(true);
      await userApi.resetPassword(resetUser.id, newPassword);
      setResetPasswordOpen(false);
      setResetUser(null);
      setNewPassword('');
      alert('密码重置成功');
    } catch (error) {
      console.error('重置密码失败:', error);
      alert('重置失败，请重试');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (user: User) => {
    try {
      await userApi.remove(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('删除用户失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      realName: user.realName,
      password: '',
      role: user.role,
      status: user.status,
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setFormData(initialFormData);
  };

  const columns = [
    { key: 'username', title: '用户名', width: 140 },
    { key: 'realName', title: '真实姓名', width: 120 },
    {
      key: 'role',
      title: '角色',
      width: 100,
      render: (value: User['role']) => {
        const config = roleLabels[value];
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
            <Shield className="w-3 h-3 mr-1" />
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (value: User['status']) => <StatusBadge status={value} />,
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
      render: (_: unknown, record: User) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            title="重置密码"
            onClick={(e) => {
              e.stopPropagation();
              setResetUser(record);
              setResetPasswordOpen(true);
            }}
          >
            <Key className="w-4 h-4" />
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
            <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
            <p className="text-gray-500 mt-1">管理系统用户及其权限</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新增用户
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">
              共 <span className="font-semibold text-gray-900">{users.length}</span> 个用户
            </span>
          </div>
        </div>

        {loading ? (
          <Loading text="加载中..." />
        ) : (
          <Table columns={columns} data={users} rowKey="id" />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editingUser ? '编辑用户' : '新增用户'}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>
              取消
            </Button>
            <Button onClick={handleSubmit} loading={formLoading}>
              {editingUser ? '保存' : '创建'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={!!editingUser}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="请输入用户名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">真实姓名</label>
              <input
                type="text"
                value={formData.realName}
                onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                placeholder="请输入真实姓名"
              />
            </div>
          </div>
          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">初始密码</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                placeholder="请设置初始密码"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value as User['role'],
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
              >
                <option value="viewer">查看者</option>
                <option value="planner">计划员</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as User['status'],
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
              >
                <option value="active">启用</option>
                <option value="disabled">禁用</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={resetPasswordOpen}
        onClose={() => {
          setResetPasswordOpen(false);
          setResetUser(null);
          setNewPassword('');
        }}
        title="重置密码"
        width="max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setResetPasswordOpen(false);
                setResetUser(null);
                setNewPassword('');
              }}
            >
              取消
            </Button>
            <Button onClick={handleResetPassword} loading={formLoading}>
              确认重置
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-gray-700">
              正在为用户 <span className="font-semibold">{resetUser?.realName}</span> (
              <span className="font-mono">{resetUser?.username}</span>) 重置密码
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
              placeholder="请输入新密码（至少6位）"
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
            <p className="text-lg font-medium text-gray-900">确定要删除这个用户吗？</p>
            <p className="text-gray-500 mt-1">
              用户: <span className="font-medium">{deleteConfirm?.realName}</span> (
              <span className="font-mono">{deleteConfirm?.username}</span>)
            </p>
            <p className="text-sm text-gray-400 mt-2">此操作不可撤销</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
