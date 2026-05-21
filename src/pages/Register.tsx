import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Home, User, Building, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Checkbox } from '../components/Checkbox';
import { Button } from '../components/Button';
import { UserType } from '../types/auth';
import { toast } from 'sonner';

export function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('student');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: '',
  });

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: '',
    };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Este campo é obrigatório.';
      isValid = false;
    }

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
    } else if (password.length < 8) {
      newErrors.password = 'A password deve ter pelo menos 8 caracteres.';
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Este campo é obrigatório.';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As passwords não coincidem.';
      isValid = false;
    }

    if (!acceptTerms) {
      newErrors.terms = 'Este campo é obrigatório.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const result = await register({
      name,
      email,
      password,
      type: userType,
    });

    if (result.success) {
      toast.success('Conta criada com sucesso!');
      // Redirect students to onboarding, others to dashboard
      if (userType === 'student') {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } else {
      toast.error(result.error || 'Erro ao criar conta');
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
            <h1 className="mb-3">Criar Conta</h1>
            <p className="text-muted-foreground">
              Junta-te à comunidade UniRoom gratuitamente
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Nome completo"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              placeholder="João Silva"
            />

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
              placeholder="Mínimo 8 caracteres"
              helperText="Usa pelo menos 8 caracteres para maior segurança"
            />

            <Input
              label="Confirmar palavra-passe"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              placeholder="Repete a palavra-passe"
            />

            <div>
              <label className="block mb-3 text-sm font-medium text-foreground">
                Tipo de conta
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setUserType('student')}
                  className={`relative p-5 border-2 rounded-xl transition-all ${
                    userType === 'student'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  {userType === 'student' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                    userType === 'student' ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <User className={`w-5 h-5 ${userType === 'student' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <p className="text-sm font-medium">Sou estudante</p>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('landlord')}
                  className={`relative p-5 border-2 rounded-xl transition-all ${
                    userType === 'landlord'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  {userType === 'landlord' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                    userType === 'landlord' ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <Building className={`w-5 h-5 ${userType === 'landlord' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <p className="text-sm font-medium">Sou senhorio</p>
                </button>
              </div>
            </div>

            <div>
              <div className={errors.terms ? 'p-3 border-2 border-red-500 rounded-xl bg-red-50' : ''}>
                <Checkbox
                  label="Aceito os termos e condições"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
              </div>
              {errors.terms && (
                <p className="mt-1.5 text-sm text-red-500 flex items-start gap-1">
                  {errors.terms}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full gap-2"
            >
              {loading ? 'A criar conta...' : 'Criar conta gratuitamente'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Já tens conta?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Entra aqui
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
