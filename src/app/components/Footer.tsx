import { Home, Mail } from 'lucide-react';
import { Link } from 'react-router';

export function Footer() {
  const companyLinks = [
    { label: 'Sobre nós', href: '/' },
    { label: 'Como funciona', href: '/#como-funciona' },
    { label: 'Quartos disponíveis', href: '/#quartos' },
  ];

  const resourceLinks = [
    { label: 'Para estudantes', to: '/register' },
    { label: 'Para senhorios', to: '/register' },
    { label: 'Entrar na conta', to: '/login' },
  ];

  const supportLinks = [
    { label: 'Contacto', href: 'mailto:suporte@uniroom.pt' },
    { label: 'Termos e condições', href: 'mailto:suporte@uniroom.pt?subject=Termos%20e%20condicoes%20UniRoom' },
    { label: 'Política de privacidade', href: 'mailto:suporte@uniroom.pt?subject=Privacidade%20UniRoom' },
  ];

  return (
    <footer className="w-full bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">UniRoom</span>
                <span className="text-xs text-muted-foreground">Alojamento Universitário</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              A plataforma que conecta estudantes com alojamento ideal através de compatibilidade real.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <a href="mailto:suporte@uniroom.pt" className="hover:text-primary transition-colors">
                suporte@uniroom.pt
              </a>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <h4 className="mb-4 text-sm font-semibold text-foreground">Empresa</h4>
                <ul className="space-y-3">
                  {companyLinks.map(link => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="mb-4 text-sm font-semibold text-foreground">Recursos</h4>
                <ul className="space-y-3">
                  {resourceLinks.map(link => (
                    <li key={link.label}>
                      <Link to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="mb-4 text-sm font-semibold text-foreground">Suporte</h4>
                <ul className="space-y-3">
                  {supportLinks.map(link => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; 2026 UniRoom. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <a href="mailto:suporte@uniroom.pt" className="hover:text-primary transition-colors">
              suporte@uniroom.pt
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}