import { Bell, LogOut, User, Settings } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header
      className={cn(
        'h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900">生产排程管理系统</h1>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
        </button>
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">
                {user?.realName || '用户'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role === 'admin' && '管理员'}
                {user?.role === 'planner' && '计划员'}
                {user?.role === 'viewer' && '查看者'}
              </p>
            </div>
          </button>
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4" />
                  个人设置
                </button>
                <hr className="my-1 border-gray-200" />
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-danger/5"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
