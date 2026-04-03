import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

interface OrderChatProps {
  orderId: string;
  customerName: string;
}

export const OrderChat = React.forwardRef<HTMLDivElement, OrderChatProps>(({ orderId, customerName }, ref) => {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`order-chat-${orderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'order_messages',
        filter: `order_id=eq.${orderId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  useEffect(() => {
    scrollToBottom();
    // Mark unread messages as read
    if (messages.length > 0 && session?.user?.id) {
      const unread = messages.filter(
        m => m.sender_id !== session.user.id && !m.read_at
      );
      if (unread.length > 0) {
        supabase
          .from('order_messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unread.map(m => m.id))
          .then();
      }
    }
  }, [messages, session?.user?.id]);

  const loadMessages = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('order_messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
    }
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !session?.user?.id) return;

    setIsSending(true);
    const { error } = await supabase.from('order_messages').insert({
      order_id: orderId,
      sender_id: session.user.id,
      sender_role: 'admin',
      message: newMessage.trim(),
    });

    if (!error) {
      setNewMessage('');
    }
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach(msg => {
    const date = formatDate(msg.created_at);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) {
      last.messages.push(msg);
    } else {
      groupedMessages.push({ date, messages: [msg] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={ref} className="flex flex-col h-[400px]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            Nenhuma mensagem ainda. Inicie a conversa com {customerName}.
          </div>
        )}

        {groupedMessages.map(group => (
          <div key={group.date}>
            <div className="flex justify-center my-3">
              <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {group.date}
              </span>
            </div>
            {group.messages.map(msg => {
              const isMe = msg.sender_id === session?.user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}
                  >
                    {!isMe && (
                      <p className="text-xs font-medium mb-0.5 opacity-70">{customerName}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    <div className={`flex items-center gap-1 justify-end mt-0.5 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      <span className="text-[10px]">{formatTime(msg.created_at)}</span>
                      {isMe && (
                        msg.read_at
                          ? <CheckCheck className="w-3 h-3" />
                          : <Check className="w-3 h-3" />
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

      {/* Input area */}
      <div className="border-t border-border p-3 flex gap-2 items-end">
        <Textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          className="min-h-[40px] max-h-[100px] resize-none text-sm"
          rows={1}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!newMessage.trim() || isSending}
          className="shrink-0"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
});

OrderChat.displayName = 'OrderChat';
