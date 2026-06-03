Ainda temos dados mockados no perfil de senhorio.

Problema:
LandlordAnalytics.tsx ainda importa:
- getAllAnalytics
- getInsights
- getComparisons
- getOverallMetrics
de ../data/mockAnalytics

LandlordDashboard.tsx ainda importa:
- getLandlordMetrics
- getDashboardActivity
- getPerformanceData
de ../data/mockLandlord

Isto faz aparecer dados falsos como:
- média/top fixos
- candidaturas mockadas
- mensagens recebidas mockadas
- views mockadas
- atividade recente mockada
- saúde do perfil parcialmente falsa

Objetivo:
Remover mocks das zonas de analytics/dashboard e calcular tudo a partir de Supabase + contexts reais.

Não mexer no design visual.
Não mexer em schema SQL sem avisar.
Não mexer em realtime já implementado.
Substituir apenas a origem dos dados.

────────────────────────────
FASE A — LandlordAnalytics real
────────────────────────────

Substituir mockAnalytics por dados reais vindos de:
- properties
- rooms
- favorites
- applications
- messages/conversations
- reports se necessário

Métricas reais:

1. totalViews
- somar property.views das properties do landlord atual
- ou room.views se a app usar views por quarto

2. totalFavorites
- contar favorites onde:
  favorite.property_id pertence às properties do landlord
  ou favorite.room_id pertence aos rooms do landlord

3. totalApplications
- contar applications onde landlord_id = user.id
  ou property_id pertence às properties do landlord

4. avgConversion
- se totalViews > 0:
  totalApplications / totalViews * 100
- se totalViews = 0:
  0

5. Analytics por alojamento:
Para cada property do landlord:
- property title
- views
- favorites
- applications
- conversionRate
- availableRooms
- occupied/reserved rooms
- potentialRevenue

6. Comparação com média/top:
Se não existir tabela real de benchmarks, não usar números falsos como se fossem reais.
Opções aceitáveis:
- calcular média/top com base nos dados reais de todos os landlords acessíveis via RLS/admin;
- ou mostrar "Benchmark indisponível" / "Ainda sem dados suficientes";
- ou manter média/top como benchmark simulado, mas claramente marcado como "estimativa demo" e não como dado real.

Preferência:
Não mostrar benchmark falso. Se não houver dados suficientes, mostrar empty state.

7. Insights automáticos:
Gerar insights com base em dados reais:
- se property sem imagens → "Adiciona fotos"
- se active property sem rooms available → "Publica quartos"
- se views altas e applications baixas → "Melhora descrição/preço"
- se favorites altos e applications baixas → "Revê candidatura/preço"
- se landlord não verificado → "Completa verificação"
- se não há dados suficientes → mostrar "Ainda não há dados suficientes para recomendações"

────────────────────────────
FASE B — LandlordDashboard real
────────────────────────────

Remover dependência de mockLandlord para:
- getLandlordMetrics
- getDashboardActivity
- getPerformanceData

Calcular com dados reais:

Resumo operacional:
- Ocupação:
  occupied/reserved rooms / total rooms * 100

- Views:
  soma de property.views ou room.views

- Receita potencial:
  soma dos preços dos quartos available/reserved/occupied + utilities se existirem

- Saúde do perfil:
  usar checklist real:
  1. tem alojamentos ativos
  2. tem quartos publicados
  3. fotos adicionadas
  4. boa visibilidade baseada em views reais
  5. senhorio verificado via verification_status/trust

Atividade recente:
Não usar getDashboardActivity mock.
Construir com dados reais recentes:
- nova candidatura
- nova mensagem
- novo favorito
- novo pedido de manutenção
- pagamento/comprovativo recebido
Ordenar por created_at desc.
Se não houver eventos reais, mostrar:
"Ainda não há atividade recente."

Desempenho por alojamento:
Para cada property:
- views reais
- candidaturas reais
- favoritos reais
- quartos disponíveis
- taxa de ocupação
- receita potencial

Gráfico/performanceData:
Se não houver tabela temporal real de views/events, não inventar gráfico.
Opções:
- usar dados reais agregados por created_at das applications/favorites/messages;
- ou mostrar empty state "Dados históricos ainda insuficientes".

────────────────────────────
FASE C — Criar hook real
────────────────────────────

Criar um hook:
useLandlordAnalytics(userId)

Este hook deve devolver:
- loading
- error
- overview
- propertyPerformance
- insights
- recentActivity
- comparisons ou benchmarkState

Pode usar:
- useProperties()
- useLandlordApplications(userId)
- useMaintenance({ scope: 'landlord' })
- useLandlordFinanceSummary(userId)
- favorites via Supabase query
- messages/conversations via hook existente ou query Supabase
- verification/trust hooks

Importante:
- usar Supabase real;
- respeitar RLS;
- filtrar tudo por landlord atual;
- não usar localStorage;
- não usar mockAnalytics;
- não usar mockLandlord;
- manter realtime/dataBus como fallback para refresh.

────────────────────────────
FASE D — Realtime / refresh
────────────────────────────

Como já temos realtime para:
- properties
- rooms
- applications
- messages
- favorites
- payments
- verification
- reports

O analytics/dashboard deve recalcular automaticamente quando esses dados mudam.

Se usar useMemo sobre hooks reais, já atualiza sozinho.
Se usar query própria, ligar ao dataBus/realtime adequado.

────────────────────────────
TESTES
────────────────────────────

1. Senhorio sem dados:
- Dashboard mostra zeros reais.
- Analytics mostra empty states, não dados fake.

2. Senhorio cria casa/quarto:
- "Tem alojamentos ativos" fica check.
- "Tem quartos publicados" fica check.
- Receita potencial atualiza.

3. Estudante favorita quarto:
- favoritos aumentam no analytics/dashboard sem F5.

4. Estudante candidata-se:
- candidaturas aumentam sem F5.
- conversão recalcula.

5. Mensagem enviada:
- mensagens recebidas/atividade recente atualiza sem F5.

6. Admin verifica senhorio:
- "Senhorio verificado" fica check.
- saúde do perfil aumenta.

7. Nenhum número mockado deve aparecer.
8. Procurar no código:
- mockAnalytics não deve ser importado em páginas reais.
- mockLandlord não deve alimentar métricas reais.