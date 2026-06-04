SQL aplicado e validado.

Confirmado:
- public.room_visit_requests existe
- RLS policies existem apenas para estudante/senhorio
- não existe policy de admin
- room_visit_requests está em supabase_realtime

Agora avançar para frontend da funcionalidade "Agendar visita".

Lógica final:
- A visita é opcional
- O estudante pode candidatar-se diretamente
- O estudante pode agendar visita antes de se candidatar
- Agendar visita não cria candidatura
- Candidatar-me continua exatamente como está
- Senhorio gere pedidos de visita
- Admin fica totalmente fora

Separação:
- applications = candidaturas
- applications.visit_date / visit_format / visit_note = visita pós-candidatura já existente
- room_visit_requests = pedido de visita antes da candidatura

Não mexer no Admin.
Não mexer no fluxo atual de candidaturas.
Não usar localStorage.
Não usar sessionStorage.
Não usar mocks.
Não inventar dados.
Tudo Supabase.

────────────────────────────
FASE 3 — Botão "Agendar visita" no detalhe do quarto/alojamento
────────────────────────────

Adicionar botão "Agendar visita" na página de detalhe do quarto/alojamento.

Onde deve aparecer:
Na área onde já existem os botões:
- Candidatar-me
- Enviar mensagem
- Guardar nos favoritos

A nova ordem recomendada:
1. Candidatar-me — botão principal azul, continua igual
2. Agendar visita — botão secundário
3. Enviar mensagem
4. Guardar nos favoritos

Regras:
- Não remover o botão Candidatar-me
- Não alterar ApplicationModal
- Não alterar create application
- Agendar visita não cria candidatura
- Agendar visita é independente

Ao clicar em "Agendar visita":
Abrir modal com:
- data e hora pretendida
- mensagem opcional
- resumo do quarto/alojamento
- botão "Enviar pedido de visita"
- botão cancelar/fechar

Validações:
- data/hora obrigatória
- não permitir data no passado
- mensagem opcional
- se faltar data/hora, mostrar erro/toast

Ao enviar:
Criar registo em public.room_visit_requests:
- id = visit-${Date.now()}-${random}
- student_id = user.id
- landlord_id = landlord do quarto/propriedade
- property_id = property.id
- room_id = room.id, se for detalhe de quarto
- requested_at = data/hora escolhida
- student_message = mensagem
- status = 'pending'

Depois de sucesso:
- fechar modal
- mostrar toast: "Pedido de visita enviado ao senhorio."
- atualizar estado local/realtime

Evitar duplicados:
Antes de criar, verificar se já existe pedido ativo do mesmo estudante para o mesmo room_id/property_id com status:
- pending
- accepted
- counter_proposed

Se existir, não criar novo pedido e mostrar:
"Já tens um pedido de visita ativo para este alojamento."

Estados visuais no detalhe:
Se já existir pedido de visita ativo para aquele quarto/alojamento, mostrar pequeno aviso:
- pending: "Pedido de visita pendente"
- accepted: "Visita aceite"
- rejected: "Pedido de visita rejeitado"
- counter_proposed: "O senhorio propôs outra data"
- cancelled: "Pedido cancelado"
- completed: "Visita concluída"

Mesmo que exista visita pendente, o botão Candidatar-me pode continuar disponível.
A visita não bloqueia candidatura.

────────────────────────────
FASE 4 — Área do estudante: "Minhas visitas"
────────────────────────────

Criar/Adicionar secção "Minhas visitas" para o estudante.

Pode ficar:
- no Dashboard do estudante
ou
- numa página própria se já houver estrutura fácil

Objetivo:
O estudante consegue ver todos os pedidos de visita que criou.

Dados:
Usar useVisitRequests / public.room_visit_requests.
Não usar mocks.
Não usar localStorage.

Mostrar cada visita com:
- nome do alojamento/quarto
- senhorio, se disponível
- data/hora pedida
- mensagem enviada
- status
- resposta do senhorio
- nova data proposta, se existir
- criado em

Estados:
- pending → "Pendente"
- accepted → "Aceite"
- rejected → "Rejeitada"
- counter_proposed → "Nova data proposta"
- cancelled → "Cancelada"
- completed → "Concluída"

Ações do estudante:
1. Cancelar pedido
- permitido se status='pending' ou status='counter_proposed'
- update status='cancelled'
- toast "Pedido de visita cancelado"

2. Aceitar nova data proposta
- se status='counter_proposed'
- atualizar requested_at = proposed_at
- limpar proposed_at ou manter para histórico simples
- status='accepted'
- toast "Nova data aceite"

3. Candidatar-me depois
- botão/link para o detalhe do quarto/alojamento
- não criar candidatura automaticamente
- apenas leva o estudante ao fluxo normal de candidatura

Empty state:
Se não houver visitas:
"Ainda não tens pedidos de visita."

Loading/error:
- mostrar loading enquanto carrega
- se Supabase falhar, mostrar erro/empty state
- nunca fallback para mock

Realtime:
- se senhorio aceitar/rejeitar/propor data, estudante deve ver atualização sem refresh, se o hook realtime já estiver ativo

────────────────────────────
FASE 5 — Senhorio: gerir pedidos de visita
────────────────────────────

Criar área "Pedidos de visita" para o senhorio.

Pode ser:
- secção no LandlordDashboard
ou
- nova página LandlordVisits
ou
- separador próprio dentro da área do senhorio

Melhor opção:
Criar uma área separada "Pedidos de visita" para não misturar com candidaturas.

Objetivo:
O senhorio vê pedidos de visita dos seus alojamentos/quartos e responde.

Dados:
Usar public.room_visit_requests filtrado por landlord_id = user.id.
Cruzar com:
- profiles do estudante para nome/email
- properties para nome/localização do alojamento
- rooms para quarto, se existir

Mostrar cada pedido com:
- nome/email do estudante
- alojamento/quarto
- data/hora pedida
- mensagem do estudante
- status
- resposta do senhorio
- data proposta, se existir
- criado em

Ações do senhorio:

1. Aceitar visita
- update status='accepted'
- landlord_message opcional
- toast "Visita aceite"

2. Rejeitar visita
- update status='rejected'
- landlord_message com motivo opcional
- toast "Visita rejeitada"

3. Propor outra data
- abrir modal
- escolher nova data/hora
- mensagem opcional
- update:
  status='counter_proposed'
  proposed_at = nova data/hora
  landlord_message = mensagem
- toast "Nova data proposta"

4. Marcar como concluída
- permitido se status='accepted'
- update status='completed'
- toast "Visita marcada como concluída"

Regras:
- tudo Supabase
- sem mocks
- sem localStorage
- sem sessionStorage
- realtime ativo
- cleanup removeChannel no hook
- não mexer em Admin
- não mexer nas candidaturas existentes
- não criar candidatura automática

Empty state:
Se não houver pedidos:
"Ainda não existem pedidos de visita."

Filtros simples recomendados:
- Todos
- Pendentes
- Aceites
- Rejeitados
- Nova data proposta
- Concluídos

────────────────────────────
FASE 6 — Verificação final da feature
────────────────────────────

Depois de implementar, fazer auditoria:

Procurar:
- localStorage
- sessionStorage
- mockVisit
- mockVisits
- mockAppointments
- mockSchedules
- room_visit_requests
- public.is_admin
- AdminDashboard
- AdminAudit
- AdminAnalytics
- AdminSettings

Confirmar:
- room_visit_requests usado apenas em estudante/senhorio
- Admin não foi alterado
- Não existe policy/admin no frontend desta feature
- Não usa localStorage/sessionStorage
- Não usa mocks
- Candidatar-me continua igual
- Agendar visita não cria candidatura
- Estudante consegue criar pedido
- Senhorio consegue aceitar/rejeitar/propor data
- Estudante vê resposta
- Realtime funciona
- Dados persistem após refresh

Devolver relatório:
1. Botão Agendar visita criado: SIM/NÃO
2. Modal de pedido criado: SIM/NÃO
3. Estudante cria room_visit_requests: SIM/NÃO
4. Minhas visitas estudante: SIM/NÃO
5. Senhorio gere pedidos: SIM/NÃO
6. Candidatura continua independente: SIM/NÃO
7. Admin ficou fora: SIM/NÃO
8. localStorage/sessionStorage: zero/SIM/NÃO
9. mocks: zero/SIM/NÃO
10. Problemas encontrados: