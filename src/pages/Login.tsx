import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Home, ArrowRight, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Checkbox } from '../components/Checkbox';
import { Button } from '../components/Button';
import { toast } from 'sonner';

export function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validateForm = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    if (!email) {
      newErrors.email = 'Este campo é obrigatório.';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Insere um email válido.';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Este campo é obrigatório.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const result = await login(email, password);

    if (result.success) {
      toast.success('Login efetuado com sucesso!');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Erro ao efetuar login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-4 mb-8 group">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-foreground">UniRoom</span>
            <span className="text-xs text-muted-foreground">Alojamento Universitário</span>
          </div>
        </Link>

        <div className="bg-card rounded-2xl p-8 border border-border" style={{ boxShadow: 'var(--shadow-lg)' }}>
          <div className="text-center mb-8">
            <h1 className="mb-3">Bem-vindo de volta</h1>
            <p className="text-muted-foreground">
              Entra na tua conta para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="exemplo@email.com"
            />

            <Input
              label="Palavra-passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder="••••••••"
            />

            <div className="flex items-center justify-between">
              <Checkbox
                label="Manter sessão iniciada"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline font-medium"
              >
                Esqueci-me da palavra-passe
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full gap-2"
            >
              {loading ? 'A entrar...' : 'Entrar'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Não tens conta?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Regista-te gratuitamente
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Contas de teste disponíveis:</p>
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Estudante:</strong> estudante@uniroom.pt / password123
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Senhorio:</strong> senhorio@uniroom.pt / password123
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
