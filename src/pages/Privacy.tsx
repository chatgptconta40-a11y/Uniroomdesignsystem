import { Link } from 'react-router';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export function Privacy() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-semibold text-primary mb-2">UniRoom</p>
              <h1 className="text-3xl font-bold text-foreground mb-3">
                Política de privacidade
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Esta política resume que dados a UniRoom usa, para que servem e como devem ser
                protegidos numa experiência de alojamento universitário.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <Card className="p-6 md:p-8 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Dados recolhidos</h2>
            <p className="text-muted-foreground leading-relaxed">
              A UniRoom pode usar dados de conta, como nome, email e tipo de utilizador, dados de perfil
              de estudante, preferências de alojamento, candidaturas, mensagens, favoritos e informação
              associada aos anúncios publicados por senhorios.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">2. Finalidade dos dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os dados são usados para autenticação, pesquisa de quartos, cálculo de compatibilidade,
              comunicação entre estudantes e senhorios, gestão de candidaturas, notificações, sinais de
              confiança e administração da plataforma.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">3. Dados de compatibilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              As respostas sobre convivência, hábitos e preferências servem para personalizar resultados
              e melhorar a qualidade das sugestões. A compatibilidade deve ser entendida como apoio à
              decisão, não como garantia de sucesso na convivência.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Mensagens e candidaturas</h2>
            <p className="text-muted-foreground leading-relaxed">
              As mensagens e candidaturas podem ser usadas para permitir comunicação, histórico de
              decisões e gestão de segurança. Conteúdos abusivos ou suspeitos podem ser analisados pela
              equipa de administração em contexto de suporte ou denúncia.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Segurança</h2>
            <p className="text-muted-foreground leading-relaxed">
              A plataforma deve proteger os dados contra acesso indevido, perda ou alteração não
              autorizada. Numa versão com backend real, os dados devem ser guardados com regras de
              acesso por perfil, políticas de segurança e auditoria.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Direitos dos utilizadores</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os utilizadores devem poder pedir correção, remoção ou esclarecimento sobre os seus dados.
              Para qualquer pedido relacionado com privacidade, deve ser usado o contacto de suporte.
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900 leading-relaxed">
              Esta página prepara a aplicação para uma apresentação mais realista. Antes de produção,
              a política deve ser alinhada com requisitos legais e com a arquitetura Supabase.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link to="/">
              <Button variant="outline">Voltar ao início</Button>
            </Link>

            <a href="mailto:suporte@uniroom.pt?subject=Privacidade%20UniRoom">
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
