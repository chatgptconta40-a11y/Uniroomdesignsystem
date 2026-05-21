Aplicar melhorias de usabilidade e consistência ao UniRoom com base na análise pericial, mas apenas nas deteções coerentes e prioritárias.

Importante:
- Não usar Supabase.
- Não usar backend real.
- Não criar novas funcionalidades complexas.
- Não redesenhar a aplicação inteira.
- Não remover funcionalidades existentes.
- Não alterar a lógica principal da aplicação.
- Usar apenas dados mock locais / estado global existente.
- Manter o design system atual do UniRoom.
- Garantir que a aplicação continua estável e sem erros.

Objetivo:
Corrigir problemas de usabilidade, feedback, navegação, formulários, contraste e hierarquia visual identificados na análise pericial, mantendo a experiência profissional e coerente.

Melhorias a aplicar:

1. Feedback de carregamento e visibilidade do estado do sistema

Adicionar feedback visual em ações que processam dados ou alteram resultados.

Aplicar em:
- página /search ao aplicar filtros;
- alternância entre vista de lista e vista de mapa;
- submissão de candidatura;
- guardar alterações de perfil;
- editar anúncio;
- pausar/reativar/publicar anúncio;
- enviar pedido de manutenção;
- alterar estado de candidatura;
- alterar estado de pedido de manutenção.

Implementar:
- skeleton cards na pesquisa durante carregamento;
- texto discreto “A pesquisar alojamentos…”;
- botões em estado disabled durante processamento;
- toasts de sucesso após ações concluídas;
- mensagens de erro claras em caso de falha simulada;
- manter empty states quando não existem resultados.

Não criar delays exagerados. O feedback deve ser breve, elegante e profissional.

2. Validação inline em formulários

Melhorar validação visual nos formulários de Login e Register.

No Login validar:
- email obrigatório;
- formato válido do email;
- password obrigatória.

No Register validar:
- nome obrigatório;
- email obrigatório;
- formato válido do email;
- password obrigatória;
- password com pelo menos 8 caracteres;
- confirmação de password igual à password;
- seleção obrigatória do tipo de conta: Estudante ou Senhorio.

Para cada erro:
- destacar campo com borda vermelha #EF4444;
- mostrar pequeno ícone de alerta;
- mostrar mensagem inline abaixo do campo;
- usar linguagem simples e direta.

Exemplos de mensagens:
- “Este campo é obrigatório.”
- “Insere um email válido.”
- “A password deve ter pelo menos 8 caracteres.”
- “As passwords não coincidem.”
- “Seleciona o tipo de conta.”

Aplicar o mesmo padrão visual a outros formulários importantes, se já existirem:
- edição de perfil;
- criação/edição de anúncio;
- candidatura;
- pedido de manutenção.

3. Botão “Anterior” no onboarding

Corrigir o fluxo de onboarding do estudante.

Implementar:
- botão “Anterior” em todos os passos exceto no primeiro;
- botão “Continuar” à direita;
- botão “Saltar por agora” sempre visível quando aplicável;
- dados preenchidos devem manter-se ao voltar;
- barra de progresso deve mostrar claramente o passo atual;
- permitir clicar em passos anteriores já concluídos;
- não permitir avançar para passos futuros não concluídos sem validação, se isso quebrar o fluxo.

Objetivo:
Dar controlo e liberdade ao utilizador sem o prender no onboarding.

4. Confirmação antes de ações críticas

Adicionar modal de confirmação antes de ações destrutivas, irreversíveis ou difíceis de desfazer.

Ações que devem pedir confirmação:
- cancelar candidatura;
- rejeitar candidatura;
- eliminar anúncio;
- arquivar anúncio;
- eliminar denúncia;
- resolver denúncia crítica;
- eliminar conversa/mensagem, se esta ação existir;
- eliminar pedido de manutenção, se esta ação existir.

Cada modal deve ter:
- título claro;
- descrição curta;
- botão secundário de cancelamento;
- botão destrutivo em vermelho #EF4444;
- overlay suave;
- design consistente com UniRoom.

Exemplos:

Cancelar candidatura:
Título: “Cancelar candidatura?”
Texto: “Tens a certeza que queres cancelar esta candidatura? O senhorio deixará de a ver como ativa.”
Botões:
- “Manter candidatura”
- “Cancelar candidatura”

Rejeitar candidatura:
Título: “Rejeitar candidatura?”
Texto: “Esta candidatura será marcada como rejeitada e o estudante será notificado.”
Botões:
- “Voltar”
- “Rejeitar candidatura”

Eliminar anúncio:
Título: “Eliminar anúncio?”
Texto: “O anúncio deixará de estar visível para estudantes.”
Botões:
- “Cancelar”
- “Eliminar anúncio”

Arquivar anúncio:
Título: “Arquivar anúncio?”
Texto: “O anúncio será removido da pesquisa, mas o histórico será mantido.”
Botões:
- “Cancelar”
- “Arquivar”

Após confirmação:
- executar ação no estado mock local/global;
- atualizar interface imediatamente;
- mostrar toast de sucesso.

5. Active state claro na navegação

Melhorar a navegação para o utilizador perceber em que página está.

Aplicar active state em:
- navbar principal;
- dropdown do utilizador;
- sidebar das áreas autenticadas;
- área do estudante;
- área do senhorio;
- área de administrador;
- navegação mobile, se existir.

Estilo do item ativo:
- texto em azul #2563EB;
- ícone em azul #2563EB;
- texto em semibold;
- fundo azul muito claro #EFF6FF ou underline azul em navegação horizontal.

Regras:
- detetar rota atual;
- aplicar active state apenas ao item correspondente;
- manter padrão consistente em toda a aplicação.

Menus devem continuar respeitando o tipo de utilizador:

Estudante sem casa ativa:
- Dashboard
- Verificação
- O Meu Perfil
- As Minhas Candidaturas
- Os Meus Favoritos
- Mensagens
- Terminar sessão

Estudante com casa ativa:
- Dashboard
- A Minha Casa
- Verificação
- O Meu Perfil
- As Minhas Candidaturas
- Os Meus Favoritos
- Mensagens
- Terminar sessão

Senhorio:
- Dashboard Senhorio
- Os Meus Alojamentos
- Candidaturas
- Pedidos de Manutenção
- Analytics
- Mensagens
- Terminar sessão

Admin:
- Backoffice Admin
- Utilizadores
- Alojamentos
- Denúncias
- Analytics
- Configurações
- Terminar sessão

Importante:
- “A Minha Casa” só deve aparecer para estudantes com alojamento ativo.
- O senhorio não deve ver opções de estudante.
- O estudante não deve ver opções de senhorio.
- O admin deve ver apenas opções administrativas.

6. Melhorar contraste e legibilidade

Corrigir textos demasiado claros.

Alterações:
- textos principais em #111827 ou #1F2937;
- textos secundários importantes em #6B7280 ou #4B5563;
- evitar #9CA3AF em texto pequeno sobre fundo claro;
- melhorar contraste de badges;
- melhorar contraste de placeholders;
- melhorar legibilidade de metadados nos cards.

Aplicar em:
- cards de alojamento;
- página /search;
- página de detalhe do alojamento;
- favoritos;
- candidaturas;
- dashboard do estudante;
- dashboard do senhorio;
- mensagens;
- manutenção;
- backoffice admin.

Não alterar layout geral, apenas cores de texto, contraste e legibilidade.

7. Reorganizar Dashboard do Senhorio

Melhorar a hierarquia visual do Dashboard do Senhorio para reduzir excesso de informação.

Problema:
O dashboard apresenta muitos blocos com importância semelhante. É preciso destacar o que é mais importante para o senhorio.

Nova estrutura:

Topo — KPIs principais:
Mostrar 4 cards destacados:
- Alojamentos ativos;
- Candidaturas pendentes;
- Mensagens novas;
- Rating médio.

Cada card deve ter:
- ícone;
- número grande;
- label clara;
- pequeno contexto ou variação, se existir.

Zona central — Ações urgentes:
Mostrar:
- candidaturas pendentes recentes;
- pedidos de manutenção pendentes;
- mensagens importantes.

Adicionar ações rápidas:
- “Ver candidaturas”;
- “Ver pedidos de manutenção”;
- “Publicar novo alojamento”.

Zona inferior — Analytics e histórico:
Mostrar:
- gráfico dos últimos 30 dias;
- visualizações;
- favoritos;
- taxa de conversão;
- atividade recente.

Melhorias visuais:
- mais espaçamento entre grupos;
- títulos de secção claros;
- cards com hierarquia visual;
- reduzir texto secundário;
- destacar ações urgentes;
- manter estilo SaaS profissional.

8. Manter coerência da área do senhorio

Garantir que as correções não quebram a lógica já existente da área do senhorio.

Regras:
- em /landlord/listings, os botões Pausar/Reativar/Publicar devem continuar a alterar estado mock local;
- badges devem atualizar imediatamente;
- Editar deve abrir modal;
- Eliminar/Arquivar deve pedir confirmação;
- /search deve mostrar apenas alojamentos com status “Ativo”;
- quando o senhorio vê o próprio anúncio, não deve aparecer “Candidatar-me”, “Guardar nos Favoritos” ou “Enviar mensagem ao senhorio”;
- deve aparecer painel de gestão do anúncio para o senhorio dono.

9. Estados e mensagens

Adicionar ou melhorar:
- loading states;
- empty states;
- error states;
- success toasts;
- warning messages;
- disabled states em botões durante processamento.

Todos os estados devem usar linguagem simples e portuguesa de Portugal.

Exemplos:
- “A pesquisar alojamentos…”
- “Alterações guardadas com sucesso.”
- “Candidatura enviada ao senhorio.”
- “Anúncio pausado com sucesso.”
- “Não foram encontrados alojamentos com estes filtros.”
- “Este anúncio já não está disponível.”

10. Requisitos finais

- Não usar Supabase.
- Não usar backend real.
- Não mexer em integrações externas.
- Não criar novas tabelas.
- Não alterar o design global profundamente.
- Não remover páginas existentes.
- Não remover funcionalidades existentes.
- Não alterar nomes principais da marca UniRoom.
- Usar apenas estado mock local/global já existente.
- Se alguma página estiver instável, priorizar estabilidade e renderização correta.
- Garantir que a aplicação continua a abrir sem erro em:
  - /dashboard
  - /search
  - /profile
  - /applications
  - /favorites
  - /messages
  - /landlord/dashboard
  - /landlord/listings
  - /landlord/applications
  - /landlord/maintenance
  - /admin

Resultado esperado:
O UniRoom deve ficar mais coerente, acessível e profissional, corrigindo os principais problemas apontados pela análise pericial sem quebrar a aplicação nem adicionar backend.