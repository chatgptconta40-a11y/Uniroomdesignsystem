Admin Supabase 100% — migração final com calma e rigor.

Contexto:
O senhorio/estudante ficam fechados por agora. Foco total no Admin.

Problema confirmado:
O Admin ainda mistura dados reais com mocks/hardcoded.

Já foi identificado:
1. AdminDashboard.tsx
- Ainda usa mockUsers para estudantes/senhorios/verificados.
- Ainda usa getAllApplications de mockLandlordCandidates para candidaturas.
- Ainda usa getAuditLog de mockAdminAudit para ações recentes.
- Deve passar a usar Supabase real.

2. AdminUsers.tsx
- Está limpo.
- Usa profiles/verifications reais.
- Manter como está, só ligar audit logs quando aprovar/rejeitar/suspender/verificar.

3. AdminProperties.tsx
- Ainda usa mockProperties.
- Ainda usa mockLandlordCandidates.
- Ainda usa mockUsers para nome do senhorio.
- Deve passar a usar properties, rooms, applications e profiles reais.
- No UI aparece “Senhorio Desconhecido”; corrigir para buscar profiles pelo landlord_id.

4. AdminReports.tsx
- Já usa reports reais.
- Mas ainda usa mockAdminAudit para registar ações.
- Ainda usa mockAdminUsersState para suspender/bloquear users.
- Suspensão/bloqueio deve usar public.profiles:
  - status
  - blocked_from_publishing
  - admin_reason

5. AdminAudit.tsx
- Página inteira ainda usa mockAdminAudit.
- Deve passar a usar public.admin_audit_logs real.

6. AdminAnalytics.tsx
- Tem números hardcoded/fake:
  - 478 estudantes
  - 156 senhorios
  - 67 casas
  - 87% ocupação
  - 345 candidaturas
  - Lisboa 1245, Porto 987, etc.
- Remover tudo isso.
- Calcular só com dados reais ou mostrar empty state.

7. AdminSettings.tsx
- Configurações parecem hardcoded/state local.
- Deve usar public.app_settings real.
- Se ainda não existir, vou correr SQL para criar.

Objetivo:
Deixar o Admin alimentado por Supabase real.
Não inventar métricas.
Não usar mocks.
Não usar localStorage para dados críticos.
Se não houver dados reais, mostrar empty state.

Não mexer:
- design visual
- estudante
- senhorio
- realtime global já implementado
- schema sem necessidade

────────────────────────────
FASE ADMIN 1 — Hook real para audit logs
────────────────────────────

Criar hook:

src/hooks/useAdminAuditLogs.ts

Tabela:
public.admin_audit_logs

Campos esperados:
- id
- admin_id
- action
- entity_type
- entity_id
- entity_label
- note
- metadata
- created_at

Hook deve devolver:
- logs
- loading
- error
- refresh()
- createLog(input)

createLog deve inserir:
{
  id: `audit-${Date.now()}-${random}`,
  admin_id: user.id,
  action,
  entity_type,
  entity_id,
  entity_label,
  note,
  metadata
}

Realtime:
- table public.admin_audit_logs
- event *
- upsert/delete por id
- cleanup removeChannel
- canal com sufixo único por instância

Apenas admins podem ler/criar audit logs, via RLS.

────────────────────────────
FASE ADMIN 2 — AdminAudit real
────────────────────────────

Substituir AdminAudit.tsx.

Remover:
- getAuditLog
- mockAdminAudit

Usar:
- useAdminAuditLogs()

Mostrar:
- logs reais
- filtros por action/entity_type
- search real sobre os logs carregados
- se não houver logs:
  "Ainda não há ações administrativas registadas."

Não inventar:
- Maria Oliveira
- Carlos Ferreira
- António Silva
- datas mockadas
- ações falsas

────────────────────────────
FASE ADMIN 3 — AdminReports real + audit
────────────────────────────

AdminReports deve continuar a usar reports reais.

Remover:
- mockAdminAudit
- mockAdminUsersState

Ações reais:
1. Resolver denúncia:
- update public.reports.status = 'resolved'
- guardar admin note/internal note
- createLog:
  action = 'report_resolved'
  entity_type = 'report'
  entity_id = report.id
  entity_label = report.title/type
  note = nota do admin

2. Rejeitar denúncia:
- update reports.status = 'dismissed' ou 'rejected' conforme enum real
- createLog action = 'report_rejected'

3. Adicionar nota:
- update reports.internal_note/admin_note
- createLog action = 'note_added'

4. Suspender user:
- update profiles.status = 'suspended'
- update profiles.admin_reason
- createLog action = 'user_suspended'

5. Bloquear publicação:
- update profiles.blocked_from_publishing = true
- update profiles.admin_reason
- createLog action = 'publishing_blocked'

6. Desbloquear:
- update profiles.status = 'active'
- update profiles.blocked_from_publishing = false
- update profiles.admin_reason = null
- createLog action = 'user_unblocked'

Não criar user_sanctions agora.
Usar profiles porque já tem:
- status
- blocked_from_publishing
- admin_reason
- verified
- verification_required

────────────────────────────
FASE ADMIN 4 — AdminDashboard real
────────────────────────────

Remover de AdminDashboard.tsx:
- mockUsers
- getAllApplications
- getAuditLog

Usar dados reais:
- profiles para users
- applications para candidaturas
- properties/rooms via useProperties
- reports via useReports
- admin_audit_logs via useAdminAuditLogs

Métricas:
- total estudantes = profiles type='student'
- total senhorios = profiles type='landlord'
- senhorios verificados = profiles.verified=true ou verification_status aprovado
- candidaturas pendentes = applications status in ('pending','under_review')
- candidaturas aceites = applications status='accepted'
- alojamentos ativos = properties status='active'
- quartos por status = rooms.status
- denúncias abertas/críticas = reports reais
- ações recentes = últimos admin_audit_logs reais

Evolução da plataforma:
- não inventar Jan/Fev/Mar/Abr/Mai.
- se não houver histórico real suficiente, mostrar:
  "Dados históricos ainda insuficientes."

────────────────────────────
FASE ADMIN 5 — AdminProperties real
────────────────────────────

Remover de AdminProperties.tsx:
- mockProperties
- mockUsers
- mockLandlordCandidates
- estado local fake prop-1/prop-2

Usar:
- useProperties para properties/rooms reais
- profiles reais para senhorio
- applications reais para candidaturas por property_id

Corrigir:
- “Senhorio Desconhecido” deve tentar buscar profiles.full_name/email pelo landlord_id.
- se não existir profile, mostrar "Senhorio não encontrado".

Ações reais:
1. Aprovar/reativar propriedade:
- update properties.status = 'active'
- update properties.admin_suspended = false
- limpar reason
- createLog action = 'property_approved' ou 'property_reactivated'

2. Suspender propriedade:
- update properties.admin_suspended = true
- update properties.status = 'paused' ou status adequado
- update properties.admin_suspension_reason
- createLog action = 'property_suspended'

3. Marcar suspeita:
- se existir campo, usar real;
- se não existir, não inventar estado local.
- avisar se precisar coluna nova.

────────────────────────────
FASE ADMIN 6 — AdminAnalytics real
────────────────────────────

Remover todos os números fake/hardcoded:
- 478 estudantes
- 156 senhorios
- 67 casas
- 87% ocupação
- 345 candidaturas
- Lisboa 1245
- Porto 987
- Coimbra 756
- Braga 543
- Aveiro 432
- Viseu 324
- Faro 289
- qualityMetrics fixos

Calcular com dados reais:
- profiles
- properties
- rooms
- applications
- reports
- trust_scores

Métricas reais:
- estudantes total = profiles type='student'
- senhorios total = profiles type='landlord'
- casas publicadas = properties status='active'
- quartos ocupados = rooms status in ('occupied','reserved')
- taxa ocupação = occupied/reserved rooms / total rooms
- candidaturas no mês = applications.created_at dentro do mês atual
- quartos disponíveis = rooms status='available'
- trust score médio estudantes/senhorios = trust_scores + profiles.type

Cidades mais ativas:
- usar properties.city real
- propriedades por cidade
- candidaturas por cidade via applications.property_id -> properties.city
- ocupação por cidade via rooms.property_id -> properties.city
- não inventar estudantes por cidade se não existir cidade nos perfis.

Se não houver dados:
- mostrar empty state
- não mostrar cidades fake.

────────────────────────────
FASE ADMIN 7 — AdminSettings real
────────────────────────────

Criar hook:
useAppSettings()

Tabela:
public.app_settings

Guardar em Supabase:
- platform_name
- main_email
- support_email
- platform_version
- auto_approve_properties
- require_email_verification
- detect_suspicious_listings
- reports_before_auto_suspension
- max_properties_per_landlord
- max_applications_per_student
- max_images_per_property
- max_message_length
- trust_bonus_verified
- trust_bonus_complete_profile
- trust_bonus_successful_application
- trust_penalty_valid_report
- notify_new_reports
- notify_critical_reports
- notify_new_properties
- notify_new_users
- notify_system_alerts

AdminSettings.tsx:
- carregar settings reais
- alterar estado local enquanto edita
- guardar alterações com update/upsert em app_settings
- createLog action = 'settings_updated'
- se não houver settings, usar defaults e criar primeira row.

Não usar localStorage.
Não deixar alterações só no frontend.

Gestão de administradores:
- para já pode ficar visual/baixo risco se não houver tabela admin_users.
- Mas não mostrar admins fake como se fossem reais.
- Preferir profiles where type='admin'.

────────────────────────────
FASE ADMIN 8 — AdminUsers real + audit
────────────────────────────

AdminUsers já está limpo.
Só acrescentar audit logs nas ações:
- confirmar email/verificação
- aprovar documento
- rejeitar documento
- suspender user
- bloquear publicação
- desbloquear user

Cada ação deve criar admin_audit_logs real.

────────────────────────────
FASE ADMIN 9 — Realtime Admin
────────────────────────────

Garantir que estas páginas atualizam com dados reais:
- AdminDashboard
- AdminUsers
- AdminProperties
- AdminReports
- AdminAudit
- AdminAnalytics
- AdminSettings

Usar:
- realtime já existente para profiles/properties/rooms/applications/reports/verification_status/trust_scores
- novo realtime para admin_audit_logs
- novo realtime para app_settings

Evitar canais duplicados infinitos.
Usar cleanup removeChannel.

────────────────────────────
FASE ADMIN 10 — Scan final
────────────────────────────

Depois da migração fazer scan final em src/pages/admin.

Procurar:
- mockUsers
- mockAdminUsersState
- mockAdminAudit
- mockLandlordCandidates
- mockProperties
- mockAnalytics
- mockLandlord
- localStorage
- arrays hardcoded com dados fake
- nomes fake
- cidades fake
- métricas fake

Resultado esperado:
- zero mocks nas páginas admin reais;
- se restar algo, justificar como seed/teste/fallback não usado.

────────────────────────────
TESTE FINAL ADMIN
────────────────────────────

Testes:
1. Criar user real → AdminUsers aumenta.
2. Criar senhorio real → AdminDashboard mostra senhorio.
3. Verificar senhorio → verificados aumenta.
4. Criar alojamento/quarto → AdminProperties e Dashboard atualizam.
5. Suspender alojamento → deixa de aparecer no Search.
6. Criar report → AdminReports mostra.
7. Resolver report → status muda e aparece audit log real.
8. Suspender user → user vê bloqueio.
9. AdminAnalytics mostra números reais ou empty state.
10. AdminSettings guarda e persiste após reload.
11. Recarregar app → dados persistem.
12. Scan final sem mocks admin.