Quero corrigir e estabilizar o sistema de mensagens da UniRoom.

Objetivo:
As mensagens têm de funcionar em todos os pontos da app onde existe lógica de contacto entre estudante e senhorio:
- página de mensagens
- detalhe de quarto/propriedade
- candidaturas
- candidaturas aceites
- dashboard do senhorio
- área “A Minha Casa” / casa ativa, se existir
- qualquer botão “contactar”, “mensagem”, “responder” ou “falar com”

NÃO mexer em:
- imagens
- upload
- storage
- properties/rooms/search
- filtros active/paused/available
- design geral
- schema da base de dados, exceto se for mesmo obrigatório

Problema principal:
O sistema de mensagens deve criar ou reutilizar conversas corretamente entre estudante e senhorio, sem trocar o sender_id e sem criar duplicados.

Rever todos os ficheiros relacionados com mensagens, incluindo se existirem:
- src/hooks/useMessages.ts
- src/pages/Messages.tsx
- src/components/StartConversationModal.tsx
- src/pages/Applications.tsx
- src/pages/RoomDetail.tsx
- src/pages/ActiveHome.tsx
- src/pages/Dashboard.tsx
- src/pages/LandlordDashboard.tsx
- src/pages/StudentDashboard.tsx
- componentes com botões de contactar/mensagem
- supabase/functions/server/index.tsx, se houver endpoints de mensagens

Regras obrigatórias:

1. Uma conversa deve ligar sempre:
- student_id
- landlord_id
- opcionalmente room_id
- opcionalmente property_id

2. Uma mensagem deve ter sempre:
- conversation_id
- sender_id
- sender_name
- content
- created_at
- read_at, se existir

3. O sender_id tem de ser sempre o utilizador que está autenticado e que está realmente a enviar a mensagem.

Nunca assumir automaticamente que quem envia é o estudante.

Exemplo:
- Se estudante contacta senhorio, sender_id = estudante autenticado.
- Se senhorio responde a candidatura, sender_id = senhorio autenticado.
- Se senhorio inicia conversa com estudante, sender_id = senhorio autenticado.
- Se estudante manda mensagem a partir da candidatura/casa ativa, sender_id = estudante autenticado.

4. Corrigir a função principal de criação/reutilização de conversa.

Se existir findOrCreateConversation, ela deve aceitar explicitamente:
- studentId
- landlordId
- roomId
- propertyId
- accommodationTitle
- accommodationImage
- initialMessage
- initialSenderId
- initialSenderName

Na criação da primeira mensagem:
sender_id = initialSenderId
sender_name = initialSenderName

Não usar automaticamente studentId como sender_id.

5. Evitar conversas duplicadas.

Antes de criar conversa nova, procurar conversa existente nesta ordem:

Se houver room_id:
- student_id igual
- landlord_id igual
- room_id igual

Se não houver room_id mas houver property_id:
- student_id igual
- landlord_id igual
- property_id igual

Se não houver room_id nem property_id:
- student_id igual
- landlord_id igual

Se encontrar, reutilizar.
Se não encontrar, criar.

6. Todos os botões de mensagem da app devem usar a mesma lógica central.

Não criar lógica diferente em cada página.
Criar ou corrigir uma função única reutilizável para:
- criar conversa
- reutilizar conversa
- criar mensagem inicial
- navegar para a conversa

7. Fluxo estudante → senhorio

Quando estudante clica em contactar:
- student_id = user autenticado
- landlord_id = landlord do quarto/propriedade
- sender_id = estudante autenticado
- conversa aparece ao estudante
- conversa aparece ao senhorio
- senhorio vê como mensagem recebida

8. Fluxo senhorio → estudante a partir de candidatura

Quando senhorio clica para mandar mensagem numa candidatura:
- student_id = estudante da candidatura
- landlord_id = senhorio autenticado
- room_id/property_id vêm da candidatura
- sender_id = senhorio autenticado
- mensagem aparece ao estudante como recebida
- mensagem aparece ao senhorio como enviada
- não criar conversa duplicada se já existir

9. Fluxo mensagens normal

Na página Messages:
- listar conversas do utilizador autenticado
- estudante vê conversas onde student_id = auth.uid()
- senhorio vê conversas onde landlord_id = auth.uid()
- ao abrir conversa, carregar mensagens dessa conversa
- ao enviar mensagem, sender_id = auth.uid()
- depois de enviar, atualizar a thread e a lista de conversas

10. Não lidas

Mensagens enviadas por mim não contam como não lidas.
Mensagens recebidas com read_at null contam como não lidas.
Ao abrir uma conversa, marcar como lidas apenas mensagens onde:
sender_id != auth.uid()

11. last_message

Sempre que uma mensagem é enviada:
- atualizar last_message_at
- atualizar last_message_preview, se existir
- atualizar updated_at, se existir

Ordenar conversas por last_message_at desc.

12. Realtime ou refresh

Se realtime existir, garantir:
- mensagens novas aparecem na thread aberta
- lista de conversas atualiza quando chega mensagem nova

Se realtime não estiver fiável, fazer fallback:
- depois de enviar mensagem, refreshMessages(conversationId)
- depois de criar conversa, refreshConversations()
- depois de abrir conversa, refreshMessages(conversationId)

13. Segurança

Frontend nunca deve usar service_role.
Se houver Edge Function, validar:
- auth.uid() pertence à conversa
- sender_id tem de ser igual a auth.uid()
- utilizador só vê mensagens das suas conversas
- utilizador só cria mensagem numa conversa onde é student_id ou landlord_id

14. Testes obrigatórios

Testar estes fluxos:

A) Estudante contacta senhorio a partir de um quarto:
- conversa criada/reutilizada
- sender_id = estudante
- aparece nos dois lados

B) Senhorio responde:
- mesma conversa
- sender_id = senhorio
- não duplica conversa

C) Senhorio inicia mensagem a partir de candidatura:
- sender_id = senhorio
- estudante recebe
- conversa aparece no perfil do estudante

D) Estudante manda mensagem a partir de candidatura/casa ativa:
- sender_id = estudante
- conversa correta
- landlord recebe

E) Clicar várias vezes em contactar:
- não cria duplicados

No final, mostrar:
- ficheiros alterados
- função central usada para criar/reutilizar conversa
- onde foi corrigido o sender_id
- que páginas/botões de mensagem foram ligados a essa lógica
- como testar manualmente