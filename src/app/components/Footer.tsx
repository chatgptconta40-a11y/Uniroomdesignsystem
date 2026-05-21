import { Home, Mail, Facebook, Instagram, Linkedin } from 'lucide-react';
import { Link } from 'react-router';

export function Footer() {
  const links = [
    { label: 'Sobre', href: '#' },
    { label: 'Como funciona', href: '#' },
    { label: 'Para senhorios', href: '#' },
    { label: 'Contacto', href: '#' },
    { label: 'Termos e Condições', href: '#' },
    { label: 'Privacidade', href: '#' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="w-full bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
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
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-9 h-9 rounded-lg bg-muted hover:bg-primary hover:text-white transition-all flex items-center justify-center group"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <h4 className="mb-4 text-sm font-semibold text-foreground">Empresa</h4>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Sobre nós
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Como funciona
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Contacto
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-4 text-sm font-semibold text-foreground">Recursos</h4>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Para Estudantes
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Para Senhorios
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Blog
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-4 text-sm font-semibold text-foreground">Legal</h4>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Termos e Condições
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Política de Privacidade
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Cookies
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
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
