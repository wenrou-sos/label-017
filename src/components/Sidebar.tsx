import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  CalendarDays,
  Cog,
  Package,
  Users,
  FileText,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  {
    path: '/dashboard',
    label: '仪表盘',
    icon: LayoutDashboard,
  },
  {
    path: '/orders',
    label: '订单管理',
    icon: ShoppingCart,
  },
  {
    path: '/gantt',
    label: '甘特图排程',
    icon: CalendarDays,
  },
  {
    path: '/machines',
    label: '机器管理',
    icon: Cog,
  },
  {
    path: '/products',
    label: '产品管理',
    icon: Package,
  },
  {
    path: '/users',
    label: '用户管理',
    icon: Users,
  },
  {
    path: '/logs',
    label: '操作日志',
    icon: FileText,
  },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!collapsed && (
          <span className="text-lg font-bold text-primary">生产排程系统</span>
        )}
        <button
          type="button"
          className={cn(
            'p-2 rounded-lg hover:bg-gray-100 transition-colors',
            collapsed && 'mx-auto'
          )}
          onClick={onToggle}
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      <nav className="p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  'hover:bg-gray-100',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-600 hover:text-gray-900',
                  collapsed && 'justify-center'
                )
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
