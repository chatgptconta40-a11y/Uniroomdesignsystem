import { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Users,
  Home,
  Flag,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ScrollText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true, description: 'Vista geral da plataforma' },
    { path: '/admin/users', icon: Users, label: 'Utilizadores', description: 'Gestão de contas e verificações' },
    { path: '/admin/properties', icon: Home, label: 'Casas e Quartos', description: 'Alojamentos e quartos publicados' },
    { path: '/admin/reports', icon: Flag, label: 'Moderação', description: 'Denúncias e relatórios' },
    { path: '/admin/audit', icon: ScrollText, label: 'Auditoria', description: 'Histórico de ações administrativas' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics', description: 'Estatísticas e métricas' },
    { path: '/admin/settings', icon: Settings, label: 'Configurações', description: 'Definições da plataforma' },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const breadcrumbs = useMemo(() => {
    const currentItem = menuItems.find(item =>
      item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
    );

    if (!currentItem || currentItem.exact) {
      return [];
    }

    return [
      { label: 'Dashboard', path: '/admin' },
      { label: currentItem.label, path: currentItem.path }
    ];
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <Link to="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">UniRoom Admin</h1>
                  <p className="text-xs text-gray-500">Painel de Gestão</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">{user?.name}</span>
                <span className="text-xs text-gray-500">Administrador</span>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-2 mt-3 text-xs">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.path} className="flex items-center gap-2">
                  {index > 0 && <ChevronRight className="w-3 h-3 text-gray-400" />}
                  <Link
                    to={crumb.path}
                    className={`${
                      index === breadcrumbs.length - 1
                        ? 'text-gray-900 font-medium'
                        : 'text-gray-500 hover:text-gray-700'
                    } transition-colors`}
                  >
                    {crumb.label}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:sticky top-[85px] left-0 h-[calc(100vh-85px)] w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out z-20 overflow-y-auto`}
        >
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={item.description}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                    active
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-500 group-hover:text-primary'}`} />
                  <div className="flex-1">
                    <span className="font-medium block">{item.label}</span>
                    {!active && (
                      <span className="text-xs text-gray-400 group-hover:text-gray-500 hidden lg:block">
                        {item.description}
                      </span>
                    )}
                  </div>
                  {active && <ChevronRight className="w-4 h-4" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 mt-auto">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Terminar sessão
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-85px)]">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
