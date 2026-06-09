Feedback sobre o sistema de mensagens:

Já confirmei no Supabase que as tabelas existem:
- public.conversations
- public.messages

Portanto o problema já não é falta de tabelas.

O problema atual:
Quando envio mensagem a partir do modal/contactar senhorio, a app navega para /messages?conversation=..., mas:
- não aparece a conversa com o senhorio
- não aparece a mensagem enviada
- parece que o chat não abre corretamente

Quero que investigues e corrijas a feature de mensagens end-to-end.

Não mexer em:
- properties
- rooms
- search
- paused/active/available filters
- imagens/upload/storage
- design geral

Foco só em:
- src/hooks/useMessages.ts
- src/pages/Messages.tsx
- src/components/StartConversationModal.tsx
- src/pages/Applications.tsx
- src/pages/LandlordPropertyDetail.tsx
- qualquer outro ficheiro que chame findOrCreateConversation

Contexto confirmado:
As tabelas conversations e messages existem no Supabase.
A tabela messages tem colunas:
- id
- conversation_id
- sender_id
- sender_name
- content
- type
- image_url
- read
- read_at
- created_at

Agora tens de verificar:

1. Se a tabela conversations tem exatamente as colunas que o frontend espera:
- id
- student_id
- student_name
- landlord_id
- landlord_name
- room_id
- property_id
- accommodation_title
- accommodation_price
- accommodation_image
- is_group
- group_name
- last_message_at
- created_at
- updated_at

Se o frontend estiver a usar colunas que não existem, corrigir o código para bater certo com a tabela real ou indicar SQL necessário.

2. Em findOrCreateConversation:
- verificar se o insert em conversations está a funcionar
- verificar se o insert em messages está a funcionar
- NÃO engolir erros silenciosamente
- fazer console.error detalhado se falhar
- lançar erro real para o modal mostrar toast de erro

Adicionar logs temporários:
[MESSAGES] creating conversation
[MESSAGES] conversation insert error
[MESSAGES] conversation created
[MESSAGES] inserting message
[MESSAGES] message insert error
[MESSAGES] message inserted
[MESSAGES] navigating to conversation

3. Verificar tipos dos IDs:
No Supabase, algumas colunas podem estar como text e outras como uuid.
Se sender_id/student_id/landlord_id forem text no Supabase, o código deve enviar strings e as RLS policies devem comparar com auth.uid()::text.
Se forem uuid, o código deve enviar UUID válido.

Não assumir. Validar contra a tabela real.

4. Corrigir useConversations:
Depois de navegar para /messages?conversation=ID, a página deve:
- carregar conversations
- encontrar a conversation pelo ID da query string
- mostrar imediatamente o painel da conversa
- mostrar loading enquanto ainda está a carregar
- quando encontrar a conversa, carregar as mensagens

Se selectedConversationId existe mas selectedConversation ainda não chegou:
- mostrar spinner/carregando conversa
- não mostrar “Bem-vindo às mensagens”
- não esconder o painel direito por engano

5. Corrigir useMessages:
Quando conversationId existe:
- carregar messages dessa conversation
- se o insert da mensagem acabou de acontecer, garantir refresh
- após sendMessage, chamar refresh()
- após findOrCreateConversation criar mensagem inicial, garantir que ao entrar na página Messages a mensagem aparece

6. Corrigir StartConversationModal:
Ao clicar enviar:
- chamar findOrCreateConversation
- se der erro, mostrar toast.error com detalhe
- se der sucesso, navegar para /messages?conversation=ID
- não mostrar sucesso se a conversa/mensagem não foi criada

7. Verificar RLS:
Se as tabelas existem mas insert/select falha, provavelmente é RLS.
Confirmar se o utilizador autenticado consegue:
- inserir conversation onde student_id = auth.uid() ou landlord_id = auth.uid()
- inserir message onde sender_id = auth.uid()
- selecionar conversations onde student_id = auth.uid() ou landlord_id = auth.uid()
- selecionar messages da conversa onde participa

Se houver erro de RLS, indicar exatamente o SQL necessário.

8. Corrigir fluxo estudante -> senhorio:
Quando estudante contacta senhorio:
- student_id = auth.uid()
- landlord_id = landlord do quarto/propriedade
- initialSenderId = auth.uid()
- message deve aparecer na thread
- conversa deve aparecer na lista

9. Corrigir fluxo senhorio -> estudante nas candidaturas:
Em LandlordPropertyDetail.tsx, o botão "Mensagem" do candidato não pode só fazer navigate('/messages').
Tem de criar/reutilizar conversa com:
- studentId = candidate.studentId
- studentName = candidate.studentName
- landlordId = user.id
- landlordName = user.name
- roomId = candidate.roomId
- propertyId = property.id
- initialSenderId = user.id
- initialSenderName = user.name

Depois navegar para /messages?conversation=ID.

10. No final, quero relatório com:
- qual era a causa real
- se era insert em conversations
- se era insert em messages
- se era RLS
- se era loading/selectedConversation
- ficheiros alterados
- como testar

Teste final obrigatório:
1. Login estudante
2. Abrir quarto
3. Enviar mensagem ao senhorio
4. Deve abrir /messages?conversation=ID
5. Deve aparecer conversa com senhorio
6. Deve aparecer a mensagem enviada

Teste 2:
1. Login senhorio
2. Abrir candidaturas/candidatos
3. Clicar mensagem num estudante
4. Deve abrir/criar conversa correta
5. sender_id deve ser do senhorio

Não mexer noutras áreas.