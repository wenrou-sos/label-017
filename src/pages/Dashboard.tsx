import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import {
  ClipboardList,
  Clock,
  CalendarCheck,
  Calendar,
  Cpu,
  TrendingUp,
  Activity,
} from 'lucide-react';
import Loading from '@/components/Loading';
import StatusBadge from '@/components/StatusBadge';
import { dashboardApi } from '@/api/dashboardApi';
import type { DashboardStats, MachineLoad, OperationLog } from 'shared/types';
import { formatDateTime, formatRelativeTime } from '@/utils/datetime';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, icon, color, bgColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className={cn('text-3xl font-bold', color)}>{value}</p>
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', bgColor)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface MachineLoadChartProps {
  data: MachineLoad[];
}

function MachineLoadChart({ data }: MachineLoadChartProps) {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Cpu className="w-5 h-5 text-primary" />
        机器负载率
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="loadRate"
              nameKey="machineName"
              label={({ machineName, loadRate }) => `${machineName} ${(Number(loadRate) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${(Number(value) * 100).toFixed(1)}%`, '负载率']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface OrderStatusChartProps {
  stats: DashboardStats;
}

function OrderStatusChart({ stats }: OrderStatusChartProps) {
  const data = [
    { name: '待排程', value: stats.pendingOrders, color: '#6B7280' },
    { name: '已排程', value: stats.scheduledOrders, color: '#3B82F6' },
    { name: '已完成', value: stats.completedOrders, color: '#10B981' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <PieChart className="w-5 h-5 text-primary" />
        订单状态分布
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, value }) => `${name} ${value}`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface RecentLogsProps {
  logs: OperationLog[];
}

function RecentLogs({ logs }: RecentLogsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        最近操作
      </h3>
      <div className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-center text-gray-500 py-8">暂无操作记录</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{log.username}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {log.module}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">{log.action}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatRelativeTime(log.createdAt)} · {formatDateTime(log.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [machineLoads, setMachineLoads] = useState<MachineLoad[]>([]);
  const [recentLogs, setRecentLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, loadsRes, logsRes] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getMachineLoads(),
          dashboardApi.getRecentLogs(5),
        ]);
        setStats(statsRes.data);
        setMachineLoads(loadsRes.data);
        setRecentLogs(logsRes.data);
      } catch (error) {
        console.error('获取仪表盘数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Loading fullScreen text="加载中..." />
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 py-12">数据加载失败</div>
    );
  }

  return (
    <div style={{ writingMode: 'horizontal-tb', direction: 'ltr' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
            <p className="text-gray-500 mt-1">生产排程概览</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <TrendingUp className="w-4 h-4" />
            <span>今日数据</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="订单总数"
            value={stats.totalOrders}
            icon={<ClipboardList className="w-6 h-6 text-primary" />}
            color="text-primary"
            bgColor="bg-primary/10"
          />
          <StatCard
            title="待排程"
            value={stats.pendingOrders}
            icon={<Clock className="w-6 h-6 text-warning" />}
            color="text-warning"
            bgColor="bg-warning/10"
          />
          <StatCard
            title="已排程"
            value={stats.scheduledOrders}
            icon={<CalendarCheck className="w-6 h-6 text-success" />}
            color="text-success"
            bgColor="bg-success/10"
          />
          <StatCard
            title="今日排程"
            value={stats.todaySchedules}
            icon={<Calendar className="w-6 h-6 text-primary" />}
            color="text-primary"
            bgColor="bg-primary/10"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MachineLoadChart data={machineLoads} />
          <OrderStatusChart stats={stats} />
        </div>

        <RecentLogs logs={recentLogs} />
      </div>
    </div>
  );
}
