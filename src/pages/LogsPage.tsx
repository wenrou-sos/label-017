import { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Clock,
  User,
  Package,
  Settings,
  Shield,
  Cpu,
  ClipboardList,
  CalendarRange,
  Filter,
} from 'lucide-react';
import Loading from '@/components/Loading';
import StatusBadge from '@/components/StatusBadge';
import { dashboardApi } from '@/api/dashboardApi';
import type { OperationLog } from 'shared/types';
import { formatDateTime } from '@/utils/datetime';

const moduleIcons: Record<string, React.ReactNode> = {
  订单: <ClipboardList className="w-4 h-4" />,
  机器: <Cpu className="w-4 h-4" />,
  产品: <Package className="w-4 h-4" />,
  用户: <User className="w-4 h-4" />,
  排程: <CalendarRange className="w-4 h-4" />,
  系统: <Settings className="w-4 h-4" />,
  权限: <Shield className="w-4 h-4" />,
};

const moduleColors: Record<string, string> = {
  订单: 'bg-blue-100 text-blue-700',
  机器: 'bg-green-100 text-green-700',
  产品: 'bg-purple-100 text-purple-700',
  用户: 'bg-orange-100 text-orange-700',
  排程: 'bg-cyan-100 text-cyan-700',
  系统: 'bg-gray-100 text-gray-700',
  权限: 'bg-red-100 text-red-700',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  const mockLogs: OperationLog[] = useMemo(
    () => [
      { id: 1, userId: 1, username: 'admin', action: '创建订单', module: '订单', targetId: 101, details: '创建订单 ORD-2024001，产品：精密齿轮，数量：100', ip: '192.168.1.100', createdAt: '2024-01-15 09:30:00' },
      { id: 2, userId: 2, username: 'planner', action: '更新排程', module: '排程', targetId: 50, details: '调整订单 ORD-2024001 的排程时间', ip: '192.168.1.101', createdAt: '2024-01-15 10:15:00' },
      { id: 3, userId: 1, username: 'admin', action: '新增机器', module: '机器', targetId: 5, details: '新增机器 M-005：数控铣床', ip: '192.168.1.100', createdAt: '2024-01-15 11:00:00' },
      { id: 4, userId: 2, username: 'planner', action: '更新订单状态', module: '订单', targetId: 101, details: '订单 ORD-2024001 状态变更为：已排程', ip: '192.168.1.101', createdAt: '2024-01-15 14:20:00' },
      { id: 5, userId: 1, username: 'admin', action: '更新产品工时', module: '产品', targetId: 10, details: '产品 P-001 单位工时由 2.5h 调整为 2.8h', ip: '192.168.1.100', createdAt: '2024-01-15 15:45:00' },
      { id: 6, userId: 3, username: 'viewer', action: '登录系统', module: '系统', targetId: 0, details: '用户登录成功', ip: '192.168.1.102', createdAt: '2024-01-15 08:00:00' },
      { id: 7, userId: 1, username: 'admin', action: '重置密码', module: '用户', targetId: 2, details: '重置用户 planner 的密码', ip: '192.168.1.100', createdAt: '2024-01-14 16:30:00' },
      { id: 8, userId: 2, username: 'planner', action: '删除排程', module: '排程', targetId: 48, details: '删除排程记录，订单：ORD-2024000', ip: '192.168.1.101', createdAt: '2024-01-14 15:20:00' },
      { id: 9, userId: 1, username: 'admin', action: '新增用户', module: '用户', targetId: 4, details: '新增用户 viewer2，角色：查看者', ip: '192.168.1.100', createdAt: '2024-01-14 10:00:00' },
      { id: 10, userId: 2, username: 'planner', action: '更新机器状态', module: '机器', targetId: 3, details: '机器 M-003 状态变更为：维护中', ip: '192.168.1.101', createdAt: '2024-01-14 09:30:00' },
    ],
    []
  );

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        try {
          const res = await dashboardApi.getRecentLogs(100);
          setLogs(res.data);
        } catch {
          setLogs(mockLogs);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [mockLogs]);

  const uniqueUsers = useMemo(() => [...new Set(logs.map((l) => l.username))], [logs]);
  const uniqueModules = useMemo(() => [...new Set(logs.map((l) => l.module))], [logs]);
  const uniqueActions = useMemo(() => [...new Set(logs.map((l) => l.action))], [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchUser = !userFilter || log.username === userFilter;
      const matchModule = !moduleFilter || log.module === moduleFilter;
      const matchAction = !actionFilter || log.action === actionFilter;
      const matchSearch =
        !search ||
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase());
      const matchStart = !startDate || log.createdAt >= startDate;
      const matchEnd = !endDate || log.createdAt <= endDate + ' 23:59:59';
      return matchUser && matchModule && matchAction && matchSearch && matchStart && matchEnd;
    });
  }, [logs, userFilter, moduleFilter, actionFilter, search, startDate, endDate]);

  if (loading) {
    return (
      <div style={{ writingMode: 'horizontal-tb', direction: 'ltr' }}>
        <Loading text="加载中..." />
      </div>
    );
  }

  return (
    <div style={{ writingMode: 'horizontal-tb', direction: 'ltr' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">操作日志</h1>
            <p className="text-gray-500 mt-1">查看系统操作记录</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">筛选条件</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索详情..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-sm"
              />
            </div>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-sm"
            >
              <option value="">全部用户</option>
              {uniqueUsers.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-sm"
            >
              <option value="">全部模块</option>
              {uniqueModules.map((module) => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </select>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-sm"
            >
              <option value="">全部操作</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-sm"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-sm"
            />
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

          {filteredLogs.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无符合条件的日志记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log, index) => (
                <div key={log.id} className="relative pl-16">
                  <div
                    className={`absolute left-4 w-5 h-5 rounded-full border-4 border-white shadow flex items-center justify-center ${
                      index === 0 ? 'bg-primary' : 'bg-gray-400'
                    }`}
                  />
                  <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            moduleColors[log.module] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {moduleIcons[log.module] || <Settings className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{log.username}</span>
                            <span className="text-gray-500">·</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${moduleColors[log.module] || 'bg-gray-100 text-gray-700'}`}>
                              {log.module}
                            </span>
                            <span className="text-gray-500">·</span>
                            <span className="text-sm text-gray-600">{log.action}</span>
                          </div>
                          <p className="text-sm text-gray-600 max-w-2xl">{log.details}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(log.createdAt)}
                            </span>
                            <span>IP: {log.ip}</span>
                            {log.targetId > 0 && <span>目标ID: {log.targetId}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
