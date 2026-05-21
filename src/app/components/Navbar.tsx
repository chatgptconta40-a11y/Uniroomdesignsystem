import { Home, LogOut, LayoutDashboard, ChevronDown, User, Bell, Heart, FileText, MessageCircle, Shield, BarChart3, Wrench } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../../components/Button';
import { TrustBadge } from '../../components/TrustBadge';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { getNotificationsForUser, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead } from '../../data/mockApplications';
import { getTotalUnreadCount } from '../../data/mockMessages';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = getNotificationsForUser(user?.id || '');
  const unreadCount = getUnreadCount(user?.id || '');
  const unreadMessagesCount = getTotalUnreadCount(user?.id || '');

  const logoHref = !isAuthenticated
    ? '/'
    : user?.type === 'landlord'
    ? '/landlord/dashboard'
    : user?.type === 'admin'
    ? '/admin'
    : '/dashboard';

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowMenu(false);
  };

  const handleNotificationClick = (notification: any) => {
    markNotificationAsRead(notification.id);
    setShowNotifications(false);

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(user?.id || '');
    setShowNotifications(false);
  };

  return (
    <nav className="w-full bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to={logoHref} className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">UniRoom</span>
              <span className="text-xs text-muted-foreground">Alojamento Universitário</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-all"
                  >
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowNotifications(false)}
                      />
                      <div className="absolute right-0 mt-2 w-96 bg-card border border-border rounded-xl shadow-lg z-20 max-h-96 overflow-y-auto">
                        <div className="sticky top-0 bg-card px-4 py-3 border-b border-border flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">Notificações</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-xs text-primary hover:underline"
                            >
                              Marcar todas como lidas
                            </button>
                          )}
                        </div>

                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-muted-foreground text-sm">
                            Sem notificações
                          </div>
                        ) : (
                          <div>
                            {notifications.map(notification => (
                              <button
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-0 ${
                                  !notification.read ? 'bg-blue-50' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                      !notification.read ? 'bg-blue-500' : 'bg-transparent'
                                    }`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-foreground mb-1">
                                      {notification.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {notification.createdAt.toLocaleDateString('pt-PT', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <Link to="/messages" className="relative">
                  <button className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-all">
                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                    {unreadMessagesCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-semibold rounded-full flex items-center justify-center">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </button>
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-muted transition-all group"
                  >
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium text-foreground">{user?.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{user?.type}</span>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg py-2 z-20">
                        <div className="px-4 py-3 border-b border-border">
                          <p className="text-sm font-medium text-foreground">{user?.name}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>

                        {user?.type === 'student' && (
                          <>
                            <Link
                              to="/dashboard"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-foreground"
                              onClick={() => setShowMenu(false)}
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              <span className="text-sm">Dashboard</span>
                            </Link>
                            <Link
                              to="/my-home"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-foreground"
                              onClick={() => setShowMenu(false)}
                            >
                              <Home className="w-4 h-4" />
                              <span className="text-sm">A Minha Casa</span>
                            </Link>
                            <div className="border-t border-border my-1" />
                            <div className="px-4 py-2">
                              <TrustBadge userId={user.id} size="sm" showLabel={false} />
                            </div>
                            <Link
                              to="/verification"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-foreground"
                              onClick={() => setShowMenu(false)}
                            >
                              <Shield className="w-4 h-4" />
                              <span className="text-sm">Verificação</span>
                            </Link>
                            <Link
                              to="/profile"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-foreground"
                              onClick={() => setShowMenu(false)}
                            >
                              <User className="w-4 h-4" />
                              <span className="text-sm">O Meu Perfil</span>
                            </Link>
                            <div className="border-t border-border my-1" />
                            <Link
                              to="/applications"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-foreground"
                              onClick={() => setShowMenu(false)}
                            >
                              <FileText className="w-4 h-4" />
                              <span className="text-sm">As Minhas Candidaturas</span>
                            </Link>
                            <Link
                              to="/favorites"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-foreground"
                              onClick={() => setShowMenu(false)}
                            >
                              <Heart className="w-4 h-4" />
                              <span className="text-sm">Os Meus Favoritos</span>
                            </Link>
                            <Link
                              to="/messages"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-foreground"
                              onClick={() => setShowMenu(false)}
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-sm">Mensagens</span>
                              {unreadMessagesCount > 0 && (
                                <span className="ml-auto w-5 h-5 bg-primary text-white text-xs font-semibold rounded-full flex items-center justify-center">
                                  {unreadMessagesCount}
                                </span>
                              )}
                            </Link>
                          </>
                        )}

                        {user?.type === 'landlord' && (
                          <>
                            <Link
                              to="/landlord/dashboard"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-foreground"
                              onClick={() => setShowMenu(false)}
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              <span className="text-sm">Dashboard Senhorio</span>
                            </Link>
                            <Link
                              to="/landlord/listings"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-foreground"
                              onClick={() => setShowMenu(false)}
                            >
                              <Home className="w-4 h-4" />
                              <span className="text-sm">Os Meus Alojamentos</span>
                            </Link>
                            <Link
                              to="/landlord/applications"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-foreground"
                              onClick={() => setShowMenu(false)}
                            >
                              <FileText className="w-4 h-4" />
                              <span className="text-sm">Candidaturas</span>
                            </Link>
                            <Link
                              to="/landlord/maintenance"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-foreground"
                              onClick={() => setShowMenu(false)}
                            >
                              <Wrench className="w-4 h-4" />
                              <span className="text-sm">Pedidos de Manutenção</span>
                            </Link>
                            <Link
                              to="/landlord/analytics"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-foreground"
                              onClick={() => setShowMenu(false)}
                            >
                              <BarChart3 className="w-4 h-4" />
                              <span className="text-sm">Analytics</span>
                            </Link>
                            <div className="border-t border-border my-1" />
                            <Link
                              to="/messages"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-foreground"
                              onClick={() => setShowMenu(false)}
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-sm">Mensagens</span>
                              {unreadMessagesCount > 0 && (
                                <span className="ml-auto w-5 h-5 bg-primary text-white text-xs font-semibold rounded-full flex items-center justify-center">
                                  {unreadMessagesCount}
                                </span>
                              )}
                            </Link>
                          </>
                        )}

                        {user?.type === 'admin' && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-foreground"
                            onClick={() => setShowMenu(false)}
                          >
                            <Shield className="w-4 h-4" />
                            <span className="text-sm">Admin Dashboard</span>
                          </Link>
                        )}

                        <div className="border-t border-border my-1" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 hover:bg-destructive/10 transition-colors flex items-center gap-3 text-destructive"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Terminar sessão</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="md">Entrar</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="md">Criar Conta</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}