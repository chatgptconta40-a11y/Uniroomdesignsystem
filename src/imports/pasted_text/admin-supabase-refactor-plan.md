Objetivo: tornar a área Admin 100% Supabase.

Não quero corrigir só documentos e denúncias.
Quero garantir que TODO o Admin funciona com Supabase real, sem mocks, sem localStorage e sem ações apenas visuais.

Admin deve ser o centro real de controlo da plataforma UniRoom.

Rever e corrigir todas as páginas Admin:

1. AdminDashboard
2. AdminUsers
3. AdminProperties
4. AdminReports
5. AdminAudit
6. AdminAnalytics
7. AdminSettings
8. AdminProfile

Regras obrigatórias:
- Supabase é a única fonte de verdade
- não usar mocks
- não usar localStorage/sessionStorage
- não usar dados hardcoded para métricas reais
- não mostrar ações que não gravam no Supabase
- se uma ação ainda não estiver implementada, esconder ou implementar
- não mexer em pagamentos/contratos
- não recriar funcionalidades removidas
- não criar tabelas novas sem pedir primeiro
- usar as tabelas reais existentes

Tabelas principais disponíveis:
- profiles
- personal_profiles
- lifestyle_profiles
- accommodation_preferences
- properties
- rooms
- applications
- favorites
- room_visit_requests
- maintenance_requests
- verification_status
- reports
- trust_scores
- reviews
- admin_audit_logs
- app_settings

Verificar página por página:

A) AdminDashboard
Confirmar que todos os KPIs vêm de Supabase real:
- total de utilizadores
- estudantes
- senhorios
- admins
- propriedades
- quartos disponíveis/ocupados
- candidaturas
- visitas pendentes
- denúncias abertas
- documentos pendentes
- manutenção pendente
- últimas ações admin
Remover qualquer valor mock/hardcoded.

B) AdminUsers
Confirmar:
- lê profiles reais
- mostra estudantes, senhorios e admins reais
- junta verification_status real
- mostra documentos pendentes reais
- aprovar documento grava em verification_status
- rejeitar documento grava em verification_status
- suspender/bloquear utilizador grava em profiles
- ações criam admin_audit_logs
- sem sucesso falso quando Supabase falha

C) AdminProperties
Confirmar:
- lê properties reais
- lê rooms reais
- mostra senhorio real via profiles
- mostra candidaturas reais associadas
- aprovar propriedade grava em properties
- suspender propriedade grava em properties
- reativar propriedade grava em properties
- ações criam admin_audit_logs
- sem ações só visuais

D) AdminReports
Confirmar:
- lê reports reais
- denúncia criada no frontend aparece aqui
- mudar status grava em reports
- under_review/resolved/rejected funcionam
- sanções sobre propriedade/senhorio gravam em Supabase real
- ações criam admin_audit_logs
- lista vazia não crasha

E) AdminAudit
Confirmar:
- lê admin_audit_logs real
- mostra ações reais
- filtros funcionam sobre dados reais
- não usa mockAdminAudit
- não escreve nada falso

F) AdminAnalytics
Confirmar:
- métricas vêm de Supabase real
- profiles/properties/rooms/applications/reports/trust_scores
- se trust_scores estiver vazio, mostrar estado vazio
- não usar dados inventados
- não esconder erros silenciosamente

G) AdminSettings
Confirmar:
- lê app_settings real
- guardar alterações grava em app_settings
- lista de admins vem de profiles type='admin'
- botão convidar admin não pode ser falso
- se convite real não estiver implementado, esconder botão ou marcar como indisponível
- não mostrar toast de sucesso se não gravar nada no Supabase
- ações criam admin_audit_logs quando relevante

H) AdminProfile
Confirmar:
- lê profile real do admin autenticado
- editar nome grava em profiles
- alterar password usa Supabase Auth corretamente
- sem localStorage

Também rever hooks Admin:
- useAdminUsers
- useReports
- useAdminAuditLogs
- useAppSettings
- useProperties
- useApplications
- useVisitRequests
- qualquer hook usado por Admin

Para cada ação Admin, confirmar:
1. botão existe?
2. escreve no Supabase?
3. trata erro?
4. mostra toast correto?
5. cria audit log?
6. atualiza UI depois?

Ações que precisam obrigatoriamente gravar:
- aprovar documento
- rejeitar documento
- suspender utilizador
- reativar utilizador
- aprovar propriedade
- suspender propriedade
- reativar propriedade
- colocar denúncia em revisão
- resolver denúncia
- rejeitar denúncia
- guardar settings
- editar perfil admin
- alterar password admin

Se alguma ação for apenas visual:
- corrigir para Supabase real
OU
- remover/ocultar a ação da UI

No final devolver relatório completo:

1. AdminDashboard 100% Supabase: SIM/NÃO
2. AdminUsers 100% Supabase: SIM/NÃO
3. AdminProperties 100% Supabase: SIM/NÃO
4. AdminReports 100% Supabase: SIM/NÃO
5. AdminAudit 100% Supabase: SIM/NÃO
6. AdminAnalytics 100% Supabase: SIM/NÃO
7. AdminSettings 100% Supabase: SIM/NÃO
8. AdminProfile 100% Supabase: SIM/NÃO
9. Mocks usados no Admin: SIM/NÃO
10. localStorage/sessionStorage usado no Admin: SIM/NÃO
11. Ações apenas visuais encontradas:
12. Ações corrigidas para Supabase:
13. Ações escondidas/removidas:
14. Tabelas Supabase usadas:
15. Problemas de RLS encontrados:
16. Erros tratados com toast:
17. Audit logs criados corretamente: SIM/NÃO
18. Ficheiros alterados:
19. Problemas ainda pendentes: