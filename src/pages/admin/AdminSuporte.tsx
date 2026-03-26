import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Plus, ArrowLeft, MessageCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  store_id: string | null;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  open: { label: 'Aberto', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  answered: { label: 'Respondido', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: MessageCircle },
  closed: { label: 'Fechado', color: 'bg-muted text-muted-foreground border-border', icon: CheckCircle2 },
};

const AdminSuporte = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's store
  const { data: storeId } = useQuery({
    queryKey: ['admin-store-id', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('store_admins')
        .select('store_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      if (data) return data.store_id;
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('created_by', user.id)
        .limit(1)
        .maybeSingle();
      return store?.id ?? null;
    },
    enabled: !!user?.id,
  });

  // Fetch tickets
  const { data: tickets = [] } = useQuery({
    queryKey: ['support-tickets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as Ticket[];
    },
    enabled: !!user?.id,
  });

  // Fetch messages for selected ticket
  const { data: messages = [] } = useQuery({
    queryKey: ['support-messages', selectedTicket?.id],
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

  // Realtime subscription for new messages
  useEffect(() => {
    if (!selectedTicket?.id) return;
    const channel = supabase
      .channel(`support-${selectedTicket.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `ticket_id=eq.${selectedTicket.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['support-messages', selectedTicket.id] });
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [selectedTicket?.id, queryClient]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Create ticket
  const createTicket = useMutation({
    mutationFn: async () => {
      const { data: ticket, error: tErr } = await supabase
        .from('support_tickets')
        .insert({ user_id: user!.id, subject: newSubject.trim(), store_id: storeId })
        .select()
        .single();
      if (tErr) throw tErr;
      await supabase.from('support_messages').insert({
        ticket_id: ticket.id,
        sender_id: user!.id,
        sender_role: 'creator',
        message: newMessage.trim(),
      });
      return ticket as Ticket;
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setSelectedTicket(ticket);
      setShowNewTicket(false);
      setNewSubject('');
      setNewMessage('');
      toast.success('Ticket criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar ticket'),
  });

  // Send reply
  const sendReply = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('support_messages').insert({
        ticket_id: selectedTicket!.id,
        sender_id: user!.id,
        sender_role: 'creator',
        message: replyText.trim(),
      });
      if (error) throw error;
      // Update ticket status back to open if it was answered
      if (selectedTicket!.status === 'answered') {
        await supabase.from('support_tickets').update({ status: 'open', updated_at: new Date().toISOString() }).eq('id', selectedTicket!.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-messages', selectedTicket!.id] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setReplyText('');
    },
    onError: () => toast.error('Erro ao enviar mensagem'),
  });

  // Chat view
  if (selectedTicket) {
    const status = statusConfig[selectedTicket.status] || statusConfig.open;
    return (
      <AdminLayout title="Suporte">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>

          <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{selectedTicket.subject}</h3>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(selectedTicket.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <Badge variant="outline" className={status.color}>{status.label}</Badge>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => {
                const isMe = m.sender_role === 'creator';
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}>
                      {!isMe && <p className="text-[10px] font-semibold text-purple-400 mb-1">Super Admin</p>}
                      <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                        {format(new Date(m.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {selectedTicket.status !== 'closed' && (
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (replyText.trim()) sendReply.mutate(); } }}
                />
                <Button onClick={() => sendReply.mutate()} disabled={!replyText.trim() || sendReply.isPending} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
            {selectedTicket.status === 'closed' && (
              <div className="p-3 border-t border-border text-center text-sm text-muted-foreground">
                Este ticket foi encerrado.
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    );
  }

  // New ticket form
  if (showNewTicket) {
    return (
      <AdminLayout title="Novo Ticket">
        <div className="max-w-lg mx-auto space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setShowNewTicket(false)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assunto</label>
              <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Ex: Problema com pagamentos" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mensagem</label>
              <Textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Descreva o problema em detalhes..." rows={5} />
            </div>
            <Button className="w-full" onClick={() => createTicket.mutate()} disabled={!newSubject.trim() || !newMessage.trim() || createTicket.isPending}>
              <Send className="w-4 h-4 mr-2" /> Enviar Ticket
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Ticket list
  return (
    <AdminLayout title="Suporte">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Envie mensagens para a equipe de suporte.</p>
          <Button onClick={() => setShowNewTicket(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Novo Ticket
          </Button>
        </div>

        {tickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum ticket de suporte ainda.</p>
            <Button onClick={() => setShowNewTicket(true)} variant="outline" size="sm" className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Abrir Primeiro Ticket
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => {
              const status = statusConfig[t.status] || statusConfig.open;
              const StatusIcon = status.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{t.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(t.updated_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
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
    </AdminLayout>
  );
};

export default AdminSuporte;
