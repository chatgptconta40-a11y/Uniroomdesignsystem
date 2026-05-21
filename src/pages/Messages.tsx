import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  MessageCircle,
  Search,
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  User,
  Home,
  Check,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getConversationsForUser,
  getMessagesForConversation,
  sendMessage,
  markConversationAsRead,
} from '../data/mockMessages';
import { Message } from '../types/message';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';

export function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'landlords' | 'students' | 'unread'>('all');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    searchParams.get('conversation') || null,
  );
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversations = getConversationsForUser(user?.id || '');
  const selectedConversation = conversations.find(conversation => conversation.id === selectedConversationId);
  const messages = selectedConversationId ? getMessagesForConversation(selectedConversationId) : [];
  const otherParticipant = selectedConversation?.participants.find(participant => participant.id !== user?.id);

  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    if (searchQuery) {
      filtered = filtered.filter(conversation => {
        const participant = conversation.participants.find(item => item.id !== user?.id);
        const query = searchQuery.toLowerCase();

        return participant?.name.toLowerCase().includes(query)
          || conversation.lastMessage?.content.toLowerCase().includes(query);
      });
    }

    if (filter === 'landlords') {
      filtered = filtered.filter(conversation =>
        conversation.participants.some(participant => participant.id !== user?.id && participant.type === 'landlord'),
      );
    } else if (filter === 'students') {
      filtered = filtered.filter(conversation =>
        conversation.participants.some(participant => participant.id !== user?.id && participant.type === 'student'),
      );
    } else if (filter === 'unread') {
      filtered = filtered.filter(conversation => conversation.unreadCount > 0);
    }

    return filtered;
  }, [conversations, searchQuery, filter, user?.id]);

  useEffect(() => {
    if (selectedConversationId) {
      markConversationAsRead(selectedConversationId, user?.id || '');
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversationId, user?.id, messages.length]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversationId) return;

    sendMessage(
      selectedConversationId,
      user?.id || '',
      user?.name || '',
      messageInput.trim(),
    );

    setMessageInput('');

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const selectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSearchParams({ conversation: conversationId });
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const difference = now.getTime() - date.getTime();
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    }

    if (days === 1) {
      return 'Ontem';
    }

    if (days < 7) {
      return date.toLocaleDateString('pt-PT', { weekday: 'short' });
    }

    return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
  };

  const formatMessageDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);

    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }

    return date.toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const quickSuggestions = [
    'Tenho interesse no quarto',
    'Ainda está disponível?',
    'Posso visitar?',
    'Quais são as condições de arrendamento?',
  ];

  const groupMessagesByDate = (messageList: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    messageList.forEach(message => {
      const messageDate = formatMessageDate(message.createdAt);

      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <MessageCircle className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Mensagens</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full border-x border-border">
            <div className="lg:col-span-1 bg-card border-r border-border flex flex-col h-full">
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Procurar conversas..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="px-4 py-3 border-b border-border flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    filter === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-card text-muted-foreground border border-border hover:bg-muted'
                  }`}
                >
                  Todas
                </button>

                <button
                  onClick={() => setFilter('landlords')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    filter === 'landlords'
                      ? 'bg-primary text-white'
                      : 'bg-card text-muted-foreground border border-border hover:bg-muted'
                  }`}
                >
                  Senhorios
                </button>

                <button
                  onClick={() => setFilter('students')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    filter === 'students'
                      ? 'bg-primary text-white'
                      : 'bg-card text-muted-foreground border border-border hover:bg-muted'
                  }`}
                >
                  Estudantes
                </button>

                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    filter === 'unread'
                      ? 'bg-primary text-white'
                      : 'bg-card text-muted-foreground border border-border hover:bg-muted'
                  }`}
                >
                  Não lidas
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Sem conversas</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredConversations.map(conversation => {
                      const participant = conversation.participants.find(item => item.id !== user?.id);
                      const isSelected = conversation.id === selectedConversationId;

                      return (
                        <button
                          key={conversation.id}
                          onClick={() => selectConversation(conversation.id)}
                          className={`w-full px-4 py-3 hover:bg-muted transition-colors text-left ${
                            isSelected ? 'bg-blue-50 border-l-4 border-primary' : ''
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="relative flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {participant?.name.charAt(0)}
                              </div>

                              {participant?.online && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-foreground truncate">
                                    {participant?.name}
                                  </h3>

                                  <Badge variant="outline" className="text-xs mt-0.5">
                                    {participant?.type === 'landlord' ? 'Senhorio' : 'Estudante'}
                                  </Badge>
                                </div>

                                <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                                  {conversation.lastMessage && formatTime(conversation.lastMessage.createdAt)}
                                </span>
                              </div>

                              <p
                                className={`text-sm truncate ${
                                  conversation.unreadCount > 0
                                    ? 'font-semibold text-foreground'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {conversation.lastMessage?.content}
                              </p>
                            </div>

                            {conversation.unreadCount > 0 && (
                              <div className="flex-shrink-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-xs text-white font-semibold">
                                  {conversation.unreadCount}
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-card flex flex-col h-full">
              {selectedConversation && otherParticipant ? (
                <>
                  <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {otherParticipant.name.charAt(0)}
                        </div>

                        {otherParticipant.online && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>

                      <div>
                        <h2 className="font-semibold text-foreground">{otherParticipant.name}</h2>
                        <p className="text-xs text-muted-foreground">
                          {otherParticipant.online ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <User className="w-4 h-4" />
                      </Button>

                      {selectedConversation.accommodationId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/accommodation/${selectedConversation.accommodationId}`)}
                        >
                          <Home className="w-4 h-4" />
                        </Button>
                      )}

                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {selectedConversation.accommodationId && (
                    <div className="px-6 py-3 bg-blue-50 border-b border-border">
                      <div className="flex items-center gap-4">
                        <img
                          src={selectedConversation.accommodationImage}
                          alt={selectedConversation.accommodationTitle}
                          className="w-12 h-12 rounded-lg object-cover"
                        />

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {selectedConversation.accommodationTitle}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            €{selectedConversation.accommodationPrice}/mês
                          </p>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/accommodation/${selectedConversation.accommodationId}`)}
                        >
                          Ver alojamento
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto px-6 py-4 bg-background">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />

                        <h3 className="text-lg font-semibold text-foreground mb-3">
                          Inicia a conversa
                        </h3>

                        <p className="text-muted-foreground mb-6">
                          Experimenta uma destas sugestões:
                        </p>

                        <div className="space-y-3">
                          {quickSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => setMessageInput(suggestion)}
                              className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors text-sm"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {groupMessagesByDate(messages).map((group, groupIndex) => (
                          <div key={groupIndex}>
                            <div className="flex items-center justify-center my-4">
                              <div className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                                {group.date}
                              </div>
                            </div>

                            {group.messages.map(message => {
                              const isOwn = message.senderId === user?.id;

                              return (
                                <div
                                  key={message.id}
                                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
                                >
                                  <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                                    <div
                                      className={`px-4 py-2 rounded-2xl ${
                                        isOwn
                                          ? 'bg-primary text-white rounded-br-sm'
                                          : 'bg-card border border-border text-foreground rounded-bl-sm'
                                      }`}
                                    >
                                      <p className="text-sm break-words">{message.content}</p>
                                    </div>

                                    <div
                                      className={`flex items-center gap-1 mt-1 px-1 ${
                                        isOwn ? 'justify-end' : 'justify-start'
                                      }`}
                                    >
                                      <span className="text-xs text-muted-foreground">
                                        {message.createdAt.toLocaleTimeString('pt-PT', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>

                                      {isOwn && (
                                        message.read ? (
                                          <CheckCheck className="w-3 h-3 text-blue-500" />
                                        ) : (
                                          <Check className="w-3 h-3 text-gray-400" />
                                        )
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}

                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-4 border-t border-border bg-card">
                    <div className="flex items-end gap-4">
                      <Button variant="ghost" size="sm" className="flex-shrink-0">
                        <Smile className="w-5 h-5" />
                      </Button>

                      <Button variant="ghost" size="sm" className="flex-shrink-0">
                        <Paperclip className="w-5 h-5" />
                      </Button>

                      <textarea
                        value={messageInput}
                        onChange={(event) => setMessageInput(event.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Escreve uma mensagem..."
                        className="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-input-background"
                        rows={1}
                      />

                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        size="sm"
                        className="flex-shrink-0"
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <MessageCircle className="w-20 h-20 text-gray-300 mb-4" />

                  <h2 className="text-2xl font-bold text-foreground mb-3">
                    Bem-vindo às mensagens
                  </h2>

                  <p className="text-muted-foreground mb-6 max-w-md">
                    Seleciona uma conversa à esquerda para começar ou contacta um senhorio através de um anúncio.
                  </p>

                  <Button onClick={() => navigate('/search')}>
                    Procurar alojamento
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}