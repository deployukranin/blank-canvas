import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import SuperAdminLayout from './SuperAdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, ArrowLeft, MessageCircle, Clock, CheckCircle2, Store, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  user_id: string;
  store_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  created_at: string;
}

interface StoreInfo {
  id: string;
  name: string;
  slug: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  open: { label: 'Aberto', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  answered: { label: 'Respondido', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: MessageCircle },
  closed: { label: 'Fechado', color: 'bg-white/10 text-white/50 border-white/10', icon: CheckCircle2 },
};

const SuperAdminSuporte = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'answered' | 'closed'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all tickets with store info
  const { data: tickets = [] } = useQuery({
    queryKey: ['sa-support-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as Ticket[];
    },
  });

  // Fetch store names for all tickets
  const storeIds = [...new Set(tickets.map(t => t.store_id).filter(Boolean))] as string[];
  const { data: stores = [] } = useQuery({
    queryKey: ['sa-stores-for-tickets', storeIds],
    queryFn: async () => {
      if (storeIds.length === 0) return [];
      const { data } = await supabase.from('stores').select('id, name, slug').in('id', storeIds);
      return (data ?? []) as StoreInfo[];
    },
    enabled: storeIds.length > 0,
  });

  const storeMap = new Map(stores.map(s => [s.id, s]));

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ['sa-support-messages', selectedTicket?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', selectedTicket!.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedTicket?.id,
  });

  // Realtime
  useEffect(() => {
    if (!selectedTicket?.id) return;
    const channel = supabase
      .channel(`sa-support-${selectedTicket.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `ticket_id=eq.${selectedTicket.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['sa-support-messages', selectedTicket.id] });
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [selectedTicket?.id, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Send reply
  const sendReply = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('support_messages').insert({
        ticket_id: selectedTicket!.id,
        sender_id: user!.id,
        sender_role: 'super_admin',
        message: replyText.trim(),
      });
      if (error) throw error;
      await supabase.from('support_tickets')
        .update({ status: 'answered', updated_at: new Date().toISOString() })
        .eq('id', selectedTicket!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa-support-messages', selectedTicket!.id] });
      queryClient.invalidateQueries({ queryKey: ['sa-support-tickets'] });
      setReplyText('');
    },
    onError: () => toast.error('Erro ao enviar'),
  });

  // Close ticket
  const closeTicket = useMutation({
    mutationFn: async () => {
      await supabase.from('support_tickets')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', selectedTicket!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa-support-tickets'] });
      setSelectedTicket(prev => prev ? { ...prev, status: 'closed' } : null);
      toast.success('Ticket encerrado');
    },
  });

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
  const openCount = tickets.filter(t => t.status === 'open').length;

  // Chat view
  if (selectedTicket) {
    const store = selectedTicket.store_id ? storeMap.get(selectedTicket.store_id) : null;
    const status = statusConfig[selectedTicket.status] || statusConfig.open;
    return (
      <SuperAdminLayout title="Suporte - Chat">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="mb-4 gap-2 text-white/60 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>

          <div className="rounded-xl border border-purple-500/20 bg-black/50 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
            {/* Header */}
            <div className="p-4 border-b border-purple-500/10 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">{selectedTicket.subject}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {store && (
                    <span className="text-xs text-purple-400 flex items-center gap-1">
                      <Store className="w-3 h-3" /> {store.name}
                    </span>
                  )}
                  <span className="text-xs text-white/40">
                    {format(new Date(selectedTicket.created_at), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={status.color}>{status.label}</Badge>
                {selectedTicket.status !== 'closed' && (
                  <Button variant="ghost" size="sm" onClick={() => closeTicket.mutate()} className="text-red-400/70 hover:text-red-400 text-xs">
                    <XCircle className="w-4 h-4 mr-1" /> Fechar
                  </Button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => {
                const isMe = m.sender_role === 'super_admin';
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      isMe
                        ? 'bg-purple-600 text-white rounded-br-md'
                        : 'bg-white/10 text-white rounded-bl-md'
                    }`}>
                      {!isMe && <p className="text-[10px] font-semibold text-purple-300 mb-1">Criador</p>}
                      {isMe && <p className="text-[10px] font-semibold text-purple-200 mb-1">Você (Super Admin)</p>}
                      <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-white/50' : 'text-white/30'}`}>
                        {format(new Date(m.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {selectedTicket.status !== 'closed' ? (
              <div className="p-3 border-t border-purple-500/10 flex gap-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Responder..."
                  className="bg-white/5 border-white/10 text-white"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (replyText.trim()) sendReply.mutate(); } }}
                />
                <Button onClick={() => sendReply.mutate()} disabled={!replyText.trim() || sendReply.isPending} size="icon" className="bg-purple-600 hover:bg-purple-700">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="p-3 border-t border-purple-500/10 text-center text-sm text-white/40">
                Ticket encerrado.
              </div>
            )}
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  // Ticket list
  return (
    <SuperAdminLayout title="Suporte">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-white/50">
            {openCount > 0 ? `${openCount} ticket(s) aberto(s)` : 'Nenhum ticket aberto'}
          </p>
          <div className="flex gap-1">
            {(['all', 'open', 'answered', 'closed'] as const).map(f => (
              <Button key={f} variant={filter === f ? 'default' : 'ghost'} size="sm"
                className={filter === f ? 'bg-purple-600' : 'text-white/50'}
                onClick={() => setFilter(f)}>
                {f === 'all' ? 'Todos' : statusConfig[f]?.label || f}
              </Button>
            ))}
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-purple-500/20 p-12 text-center">
            <MessageCircle className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">Nenhum ticket encontrado.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTickets.map((t) => {
              const status = statusConfig[t.status] || statusConfig.open;
              const StatusIcon = status.icon;
              const store = t.store_id ? storeMap.get(t.store_id) : null;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className="w-full text-left rounded-xl border border-purple-500/10 bg-black/30 p-4 hover:border-purple-500/30 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate">{t.subject}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {store && (
                        <span className="text-xs text-purple-400 flex items-center gap-1">
                          <Store className="w-3 h-3" /> {store.name}
                        </span>
                      )}
                      <span className="text-xs text-white/30">
                        {format(new Date(t.updated_at), "dd MMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`${status.color} shrink-0 gap-1`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSuporte;
