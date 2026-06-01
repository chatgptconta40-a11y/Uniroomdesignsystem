Quero fazer uma migração séria da UniRoom para Supabase como fonte principal de dados.

Objetivo:
Passar progressivamente todos os dados críticos que ainda estão em localStorage/mock files para Supabase, mantendo localStorage apenas como fallback/cache temporário.

Muito importante:
NÃO quero uma alteração rápida que parta a aplicação.
NÃO quero apagar funcionalidades existentes.
NÃO quero recriar o design.
NÃO quero remover localStorage de uma vez.
NÃO quero Edge Functions.
Usar apenas Supabase client direto no frontend.

A regra da app deve passar a ser:

1. Supabase é a fonte principal.
2. localStorage é apenas fallback/cache.
3. Se Supabase estiver disponível, todas as ações críticas devem gravar e ler da Supabase.
4. Se Supabase falhar, a app pode usar localStorage, mas não deve fingir que está sincronizado.
5. Nunca apagar dados locais só porque Supabase devolveu vazio.
6. Nunca trocar user.id de forma a perder dados associados.
7. Não criar duas fontes de verdade para o mesmo domínio.

Quero uma auditoria rigorosa antes de alterar código.

Analisa todos os ficheiros que ainda usam localStorage, especialmente:
- src/context/AuthContext.tsx
- src/context/PropertiesContext.tsx
- src/context/AccommodationsContext.tsx
- src/context/FavoritesContext.tsx
- src/data/mockApplications.ts
- src/data/unifiedApplications.ts
- src/data/mockLandlordCandidates.ts
- src/data/mockHousingFinance.ts
- src/data/mockMaintenance.ts
- src/data/mockMessages.ts
- src/data/mockProfiles.ts
- src/data/mockTrust.ts
- src/data/mockProperties.ts
- src/data/mockUsers.ts
- src/pages/MyHome.tsx
- src/pages/Applications.tsx
- src/pages/LandlordApplications.tsx
- src/pages/LandlordContracts.tsx
- src/pages/LandlordPayments.tsx
- src/pages/Messages.tsx
- src/pages/LandlordMaintenance.tsx
- src/components/ApplicationModal.tsx
- src/components/MaintenanceModal.tsx
- src/components/LandlordContractManager.tsx

Também analisa:
- src/hooks/useDb.ts

Este ficheiro já tem hooks Supabase para várias tabelas, mas muitas páginas ainda não os usam. Quero perceber o que já existe, o que está incompleto e o que deve ser reaproveitado.

Tabelas Supabase que devem existir ou ser confirmadas:
- profiles
- properties
- rooms
- applications
- active_homes
- rental_contracts
- rent_payments
- payment_methods
- maintenance_requests
- conversations
- conversation_participants
- messages
- notifications
- favorites
- verification_status
- trust_scores
- reports
- audit_logs
- listing_analytics

Prioridade de migração:

FASE 1 — Candidaturas
Problema atual:
As candidaturas ainda estão a ser criadas via localStorage através de unifiedApplications.ts, mockApplications.ts e mockLandlordCandidates.ts.

Objetivo:
- ApplicationModal deve gravar candidatura em Supabase na tabela applications.
- Applications do estudante deve ler da tabela applications filtrada por user_id.
- LandlordApplications deve ler da tabela applications filtrada por landlord_id.
- Não depender de uniroom_applications nem uniroom_landlord_applications como fonte principal.
- localStorage só como fallback.
- Se estudante envia candidatura no computador A, senhorio deve ver no computador B.

FASE 2 — Active Home / A Minha Casa
Objetivo:
- Quando a candidatura é confirmada, criar active_home na tabela active_homes.
- MyHome deve ler active_home da Supabase primeiro.
- Se Supabase falhar, usar fallback local.
- A Minha Casa deve continuar após logout/login, refresh, tela grande e outro computador.
- active_home deve suportar quarto e casa completa.

FASE 3 — Contratos
Objetivo:
- Contratos devem estar em rental_contracts.
- LandlordContracts deve ler contratos da Supabase.
- MyHome pode continuar a mostrar contrato dentro de A Minha Casa, mas deve vir da Supabase.
- Edição de contrato pelo senhorio deve atualizar Supabase.
- localStorage apenas fallback.

FASE 4 — Pagamentos
Objetivo:
- Pagamentos devem estar em rent_payments.
- Métodos/dados de recebimento devem estar em payment_methods.
- LandlordPayments deve ler pagamentos da Supabase.
- MyHome deve mostrar pagamentos da Supabase.
- Estudante submete comprovativo.
- Senhorio valida comprovativo.
- Pagamento só fica “Pago” após validação do senhorio.
- A UniRoom NÃO executa pagamentos reais.
- A UniRoom apenas guarda comprovativos e validações.

FASE 5 — Manutenção
Objetivo:
- Pedidos de manutenção devem ir para maintenance_requests.
- MaintenanceModal deve criar pedido na Supabase.
- LandlordMaintenance deve ler da Supabase.
- Se estudante cria pedido no computador A, senhorio vê no computador B.

FASE 6 — Mensagens
Objetivo:
- Mensagens devem usar conversations, conversation_participants e messages.
- Remover dependência principal de mockMessages.
- Messages.tsx deve usar Supabase.
- Mensagens devem aparecer entre computadores.

FASE 7 — Favoritos
Objetivo:
- Favoritos devem ir para tabela favorites.
- FavoritesContext deve tentar Supabase primeiro.
- Favoritos devem sincronizar entre computadores.
- localStorage apenas cache.

FASE 8 — Perfis, verificação e confiança
Objetivo:
- Perfis devem estar em profiles, personal_profiles, lifestyle_profiles e accommodation_preferences, se existirem.
- Verificação deve estar em verification_status.
- Trust score deve estar em trust_scores.
- mockTrust e mockProfiles só podem ser fallback.

FASE 9 — Admin e analytics
Objetivo:
- Admin deve ler users/profiles/reports/audit_logs/listing_analytics da Supabase.
- mockAdmin* deve deixar de ser fonte principal.

Antes de alterar código, entrega um relatório com esta tabela:

Funcionalidade | Ficheiros atuais | Usa localStorage? | Usa Supabase? | Problema | Solução proposta | Risco

Depois, aplica por fases.

Não fazer tudo num commit gigante.
Começar pela FASE 1:
- applications
- ApplicationModal
- Applications
- LandlordApplications
- unifiedApplications

Critérios de sucesso da FASE 1:
1. Estudante no computador A envia candidatura.
2. Candidatura é gravada na tabela applications da Supabase.
3. Senhorio no computador B vê candidatura recebida.
4. Estudante vê candidatura em “As Minhas Candidaturas”.
5. Se Supabase falhar, pode guardar em localStorage fallback.
6. A UI não muda visualmente.

Critérios de sucesso globais:
- Dados importantes aparecem em computadores diferentes.
- Logout/login não apaga dados.
- Refresh não apaga dados.
- Tela grande/tela pequena não altera dados.
- Supabase é fonte principal.
- localStorage é fallback, não fonte principal.

Não alterar design visual.
Não alterar textos principais sem necessidade.
Não recriar páginas.
Não usar Edge Functions.
Não processar pagamentos reais.