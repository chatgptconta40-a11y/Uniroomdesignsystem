import { Link } from 'react-router';
import { FileText, Mail, ShieldCheck } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export function Terms() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-semibold text-primary mb-2">UniRoom</p>
              <h1 className="text-3xl font-bold text-foreground mb-3">
                Termos e condições
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Estes termos explicam as regras essenciais de utilização da UniRoom para estudantes,
                senhorios e equipa de administração.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <Card className="p-6 md:p-8 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Finalidade da plataforma</h2>
            <p className="text-muted-foreground leading-relaxed">
              A UniRoom ajuda estudantes a encontrar quartos e alojamentos universitários, permitindo
              pesquisar, comparar, contactar senhorios, guardar favoritos e submeter candidaturas.
              A plataforma não substitui a análise presencial do alojamento nem a celebração formal de
              contratos entre estudantes e senhorios.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">2. Contas de utilizador</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cada utilizador deve fornecer informação verdadeira e manter os seus dados atualizados.
              Estudantes devem usar a conta para procurar alojamento de forma responsável. Senhorios
              devem garantir que os anúncios publicados correspondem ao estado real dos quartos,
              preços, disponibilidade e condições.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">3. Anúncios e candidaturas</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os anúncios devem incluir informação clara sobre localização, preço, despesas, regras da
              casa, disponibilidade e comodidades. As candidaturas devem ser enviadas com mensagens
              respeitosas e dados corretos. A UniRoom pode remover conteúdos abusivos, enganosos ou
              contrários ao objetivo académico da plataforma.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Verificação e confiança</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os sinais de verificação e confiança ajudam a reduzir risco, mas não garantem por si só a
              inexistência de problemas. Antes de qualquer pagamento ou compromisso, os estudantes
              devem confirmar a identidade do senhorio, visitar o alojamento quando possível e rever as
              condições combinadas.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Comportamento proibido</h2>
            <p className="text-muted-foreground leading-relaxed">
              Não é permitido publicar anúncios falsos, pedir pagamentos suspeitos, usar linguagem
              discriminatória, assediar outros utilizadores, criar contas falsas ou tentar contornar
              mecanismos de segurança da plataforma.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Contacto e suporte</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para dúvidas, denúncias ou pedidos relacionados com estes termos, contacta a equipa
              UniRoom através do email de suporte.
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900 leading-relaxed">
              Esta página é uma versão funcional para demonstração académica. Numa versão comercial,
              os termos devem ser revistos juridicamente antes do lançamento.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link to="/">
              <Button variant="outline">Voltar ao início</Button>
            </Link>

            <a href="mailto:suporte@uniroom.pt?subject=Termos%20e%20condicoes%20UniRoom">
              <Button variant="primary">
                <Mail className="w-4 h-4 mr-2" />
                Contactar suporte
              </Button>
            </a>
          </div>
        </Card>
      </section>
    </main>
  );
}
