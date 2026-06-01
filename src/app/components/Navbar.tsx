import { Home, LogOut, LayoutDashboard, ChevronDown, User, Bell, Heart, FileText, MessageCircle, Shield, BarChart3, Wrench, Search, PlusCircle, Wallet, FileSignature, ArrowLeftRight } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { getNotificationsForUser, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead, getActiveHomeForStudent } from '../../data/mockApplications';
import { getTotalUnreadCount } from '../../data/mockMessages';
import { getVerificationStatus } from '../../data/mockTrust';

function VerificationStatusPill({ userId }: { userId: string }) {
  const status = getVerificationStatus(userId);
  const verified = status?.level === 'gold';
  return (
    <span
      className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        verified
          ? 'bg-green-100 text-green-700'
          : 'bg-amber-100 text-amber-700'
      }`}
    >
      {verified ? 'Verificado' : 'Pendente'}
    </span>
  );
}

import { getHomePath } from '../../utils/navigation';

export function Navbar() {
  const { isAuthenticated, user, logout, viewMode, setViewMode, canSwitchModes } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = getNotificationsForUser(user?.id || '');
  const unreadCount = getUnreadCount(user?.id || '');
  const unreadMessagesCount = getTotalUnreadCount(user?.id || '');
  const hasActiveHome = (user?.type === 'student' || user?.type === 'landlord')
    ? !!getActiveHomeForStudent(user.id)
    : false;

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinkClass = (path: string) =>
    `flex items-center gap-3 px-4 py-2 transition-colors rounded-lg mx-1 ${
      isActive(path)
        ? 'bg-blue-50 text-blue-600 font-semibold'
        : 'hover:bg-muted text-foreground'
    }`;

  const logoHref = !isAuthenticated ? '/' : getHomePath(user, viewMode);

  const handleSwitchMode = (mode: 'landlord' | 'tenant') => {
    setViewMode(mode);
    setShowMenu(false);
  };

  const isLandlordView = user?.type === 'landlord' && viewMode === 'landlord';

  const handleLogout = async () => {
    setShowMenu(false);
    setShowNotifications(false);

    await logout();

    navigate('/', { replace: true });
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
                {user?.type !== 'admin' && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-all"
                      aria-label="Abrir notificações"
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
                        <div className="fixed left-3 right-3 top-[72px] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 bg-card border border-border rounded-xl shadow-lg z-20 max-h-[calc(100dvh-5rem)] sm:max-h-96 overflow-y-auto">
                          <div className="sticky top-0 bg-card px-4 py-3 border-b border-border flex items-center justify-between gap-3">
                            <h3 className="font-semibold text-foreground">Notificações</h3>
                            {unreadCount > 0 && (
                              <button
                                type="button"
                                onClick={handleMarkAllRead}
                                className="text-xs text-primary hover:underline text-right"
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
                )}

                {user?.type !== 'admin' && (
                  <Link to="/messages" className="relative">
                    <button
                      type="button"
                      className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-all"
                      aria-label="Abrir mensagens"
                    >
                      <MessageCircle className="w-5 h-5 text-muted-foreground" />
                      {unreadMessagesCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-semibold rounded-full flex items-center justify-center">
                          {unreadMessagesCount}
                        </span>
                      )}
                    </button>
                  </Link>
                )}

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

                        {user && user.type !== 'admin' && !isLandlordView && (
                          <>
                            <Link
                              to="/search"
                              className={navLinkClass('/search')}
                              onClick={() => setShowMenu(false)}
                            >
                              <Search className="w-4 h-4" />
                              <span className="text-sm">Procurar Alojamento</span>
                            </Link>
                            <Link
                              to="/dashboard"
                              className={navLinkClass('/dashboard')}
                              onClick={() => setShowMenu(false)}
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              <span className="text-sm">Dashboard</span>
                            </Link>
                            {hasActiveHome && (
                              <Link
                                to="/my-home"
                                className={navLinkClass('/my-home')}
                                onClick={() => setShowMenu(false)}
                              >
                                <Home className="w-4 h-4" />
                                <span className="text-sm">A Minha Casa</span>
                              </Link>
                            )}
                            <Link
                              to="/applications"
                              className={navLinkClass('/applications')}
                              onClick={() => setShowMenu(false)}
                            >
                              <FileText className="w-4 h-4" />
                              <span className="text-sm">As Minhas Candidaturas</span>
                            </Link>
                            <Link
                              to="/favorites"
                              className={navLinkClass('/favorites')}
                              onClick={() => setShowMenu(false)}
                            >
                              <Heart className="w-4 h-4" />
                              <span className="text-sm">Os Meus Favoritos</span>
                            </Link>
                            <Link
                              to="/messages"
                              className={navLinkClass('/messages')}
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
                            <div className="border-t border-border my-1" />
                            <Link
                              to="/verification"
                              className={navLinkClass('/verification')}
                              onClick={() => setShowMenu(false)}
                            >
                              <Shield className="w-4 h-4" />
                              <span className="text-sm">Verificação</span>
                              <VerificationStatusPill userId={user.id} />
                            </Link>
                            <Link
                              to="/profile"
                              className={navLinkClass('/profile')}
                              onClick={() => setShowMenu(false)}
                            >
                              <User className="w-4 h-4" />
                              <span className="text-sm">O Meu Perfil</span>
                            </Link>
                            {canSwitchModes && (
                              <>
                                <div className="border-t border-border my-1" />
                                <button
                                  onClick={() => handleSwitchMode('landlord')}
                                  className="w-full text-left px-4 py-2 hover:bg-muted transition-colors flex items-center gap-3"
                                >
                                  <ArrowLeftRight className="w-4 h-4" />
                                  <span className="text-sm">Voltar ao modo senhorio</span>
                                </button>
                              </>
                            )}
                          </>
                        )}

                        {isLandlordView && user && (
                          <>
                            <Link
                              to="/landlord/dashboard"
                              className={navLinkClass('/landlord/dashboard')}
                              onClick={() => setShowMenu(false)}
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              <span className="text-sm">Dashboard Senhorio</span>
                            </Link>
                            <Link
                              to="/landlord/listings"
                              className={navLinkClass('/landlord/listings')}
                              onClick={() => setShowMenu(false)}
                            >
                              <Home className="w-4 h-4" />
                              <span className="text-sm">Os Meus Alojamentos</span>
                            </Link>
                            <Link
                              to="/landlord/new-listing"
                              className={navLinkClass('/landlord/new-listing')}
                              onClick={() => setShowMenu(false)}
                            >
                              <PlusCircle className="w-4 h-4" />
                              <span className="text-sm">Novo Alojamento</span>
                            </Link>
                            <Link
                              to="/landlord/applications"
                              className={navLinkClass('/landlord/applications')}
                              onClick={() => setShowMenu(false)}
                            >
                              <FileText className="w-4 h-4" />
                              <span className="text-sm">Candidaturas recebidas</span>
                            </Link>
                            <Link
                              to="/landlord/maintenance"
                              className={navLinkClass('/landlord/maintenance')}
                              onClick={() => setShowMenu(false)}
                            >
                              <Wrench className="w-4 h-4" />
                              <span className="text-sm">Manutenção</span>
                            </Link>
                            <Link
                              to="/landlord/analytics"
                              className={navLinkClass('/landlord/analytics')}
                              onClick={() => setShowMenu(false)}
                            >
                              <BarChart3 className="w-4 h-4" />
                              <span className="text-sm">Analytics</span>
                            </Link>
                            <Link
                              to="/landlord/payments"
                              className={navLinkClass('/landlord/payments')}
                              onClick={() => setShowMenu(false)}
                            >
                              <Wallet className="w-4 h-4" />
                              <span className="text-sm">Pagamentos</span>
                            </Link>
                            <Link
                              to="/landlord/contracts"
                              className={navLinkClass('/landlord/contracts')}
                              onClick={() => setShowMenu(false)}
                            >
                              <FileSignature className="w-4 h-4" />
                              <span className="text-sm">Contratos</span>
                            </Link>
                            <Link
                              to="/messages"
                              className={navLinkClass('/messages')}
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
                            <div className="border-t border-border my-1" />
                            <Link
                              to="/verification"
                              className={navLinkClass('/verification')}
                              onClick={() => setShowMenu(false)}
                            >
                              <Shield className="w-4 h-4" />
                              <span className="text-sm">Verificação</span>
                              <VerificationStatusPill userId={user.id} />
                            </Link>
                            <Link
                              to="/profile"
                              className={navLinkClass('/profile')}
                              onClick={() => setShowMenu(false)}
                            >
                              <User className="w-4 h-4" />
                              <span className="text-sm">O Meu Perfil</span>
                            </Link>
                            <div className="border-t border-border my-1" />
                            <button
                              onClick={() => handleSwitchMode('tenant')}
                              className="w-full text-left px-4 py-2 hover:bg-muted transition-colors flex items-center gap-3"
                            >
                              <Search className="w-4 h-4" />
                              <span className="text-sm">Usar como inquilino</span>
                            </button>
                          </>
                        )}

                        {user?.type === 'admin' && (
                          <>
                            <Link
                              to="/admin"
                              className={navLinkClass('/admin')}
                              onClick={() => setShowMenu(false)}
                            >
                              <Shield className="w-4 h-4" />
                              <span className="text-sm">Backoffice Admin</span>
                            </Link>
                          </>
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
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-base font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-base font-semibold shadow-sm hover:bg-primary-hover hover:shadow-md transition-all"
                >
                  Criar Conta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
