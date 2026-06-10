import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-lg">
        <div className="relative mb-8">
          <h1 className="text-[150px] font-bold text-primary/10 leading-none">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-danger/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-danger" />
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-4">页面未找到</h2>
        <p className="text-gray-500 mb-8 text-lg">
          抱歉，您访问的页面不存在或已被移除。
          <br />
          请检查您输入的URL是否正确，或返回首页继续浏览。
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button onClick={() => navigate('/dashboard')} size="lg">
            <Home className="w-5 h-5 mr-2" />
            返回首页
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)} size="lg">
            返回上一页
          </Button>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-400">
            如果您认为这是一个错误，请联系系统管理员。
          </p>
          <p className="text-xs text-gray-300 mt-2">生产排程管理系统 v1.0</p>
        </div>
      </div>
    </div>
  );
}
