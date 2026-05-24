import { useState } from 'react';
import { Link } from 'react-router';
import { Home, CheckCircle, ArrowRight, ArrowLeft, Mail } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { toast } from 'sonner';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email é obrigatório');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email inválido');
      return;
    }

    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    setLoading(false);
    setSubmitted(true);
    toast.success('Email de recuperação enviado!');
  };

  if (submitted) {
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

          <div className="bg-card rounded-2xl p-8 border border-border text-center" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="w-20 h-20 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-secondary" />
            </div>

            <h2 className="mb-3">Email Enviado!</h2>
            <p className="text-muted-foreground mb-3">
              Se existir uma conta associada a <strong className="text-foreground">{email}</strong>, receberás um link para redefinir a tua palavra-passe.
            </p>

            <div className="bg-muted/50 rounded-xl p-4 my-6">
              <div className="flex items-start gap-4">
                <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground text-left">
                  Verifica a tua caixa de entrada e a pasta de spam. O link é válido por 24 horas.
                </p>
              </div>
            </div>

            <Link to="/login">
              <Button variant="primary" className="w-full gap-2">
                Voltar ao login
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-accent" />
            </div>
            <h1 className="mb-3">Recuperar Palavra-passe</h1>
            <p className="text-muted-foreground">
              Insere o teu email e enviaremos um link para redefinir a palavra-passe
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              placeholder="exemplo@email.com"
              helperText="Receberás um link de recuperação neste email"
            />

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full gap-2"
            >
              {loading ? 'A enviar...' : 'Enviar link de recuperação'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
