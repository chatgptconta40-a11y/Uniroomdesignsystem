import { Link, useNavigate } from 'react-router';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function NotFound() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!isAuthenticated) return '/';
    if (user?.type === 'landlord') return '/landlord/dashboard';
    if (user?.type === 'admin') return '/admin';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <span className="text-8xl font-black text-primary/20 select-none">404</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Página não encontrada
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          A página que procuras não existe ou foi movida.
          Verifica o endereço ou volta ao início.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-border text-foreground font-semibold rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <Link
            to={getDashboardPath()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Home className="w-4 h-4" />
            {isAuthenticated ? 'Ir para o Dashboard' : 'Ir para o início'}
          </Link>
          {isAuthenticated && user?.type === 'student' && (
            <Link
              to="/search"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary-hover transition-colors"
            >
              <Search className="w-4 h-4" />
              Pesquisar quartos
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}