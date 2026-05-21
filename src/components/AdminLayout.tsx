import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Users,
  Home,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Utilizadores' },
    { path: '/admin/listings', icon: Home, label: 'Alojamentos' },
    { path: '/admin/reports', icon: AlertTriangle, label: 'Denúncias' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/admin/settings', icon: Settings, label: 'Definições' },
  ];

  const currentPageLabel =
    menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 bg-card border-r border-border fixed left-0 top-0 bottom-0 flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <Shield className="w-6 h-6 text-white" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-foreground">UniRoom Admin</h1>
              <p className="text-xs text-muted-foreground">Backoffice</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-64">
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {currentPageLabel}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Gestão e monitorização da plataforma UniRoom
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">Administrador</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}