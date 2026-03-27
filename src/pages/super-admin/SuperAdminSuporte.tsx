import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import SuperAdminLayout from './SuperAdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, ArrowLeft, MessageCircle, Clock, CheckCircle2, Store, XCircle, Check, CheckCheck, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  user_id: string;
  store_id: string | null;
  store_name: string | null;
  creator_email: string | null;
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
  read_at: string | null;
}

interface StoreInfo {
  id: string;
  name: string;
  slug: string | null;
}

const getStatusConfig = (t: any) => ({
  open: { label: t('admin.support.statusOpen'), color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  answered: { label: t('admin.support.statusAnswered'), color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: MessageCircle },
  closed: { label: t('admin.support.statusClosed'), color: 'bg-white/10 text-white/50 border-white/10', icon: CheckCircle2 },
});

const SuperAdminSuporte = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'answered' | 'closed'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all tickets
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

  // Fetch store names for tickets that don't have store_name cached
  const storeIds = [...new Set(tickets.filter(t => t.store_id && !t.store_name).map(t => t.store_id))] as string[];
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

  // Helper to get store name (from ticket field or from fetched stores)
  const getStoreName = (t: Ticket) => {
    if (t.store_name) return t.store_name;
    if (t.store_id) return storeMap.get(t.store_id)?.name ?? null;
    return null;
  };

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

  // Mark creator messages as read when super admin opens the chat
  useEffect(() => {
    if (!selectedTicket?.id || !user?.id) return;
    const unreadFromCreator = messages.filter(m => m.sender_role === 'creator' && !m.read_at);
    if (unreadFromCreator.length > 0) {
      const ids = unreadFromCreator.map(m => m.id);
      supabase
        .from('support_messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', ids)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['sa-support-messages', selectedTicket.id] });
        });
    }
  }, [selectedTicket?.id, messages, user?.id, queryClient]);

  // Realtime
  useEffect(() => {
    if (!selectedTicket?.id) return;
    const channel = supabase
      .channel(`sa-support-${selectedTicket.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_messages',
        filter: `ticket_id=eq.${selectedTicket.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['sa-support-messages', selectedTicket.id] });
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [selectedTicket?.id, queryClient]);

  // Also listen for new tickets
  useEffect(() => {
    const channel = supabase
      .channel('sa-new-tickets')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_tickets',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['sa-support-tickets'] });
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [queryClient]);

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
    onError: () => toast.error(t('superAdmin.support.sendError')),
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
      toast.success(t('superAdmin.support.ticketClosed'));
    },
  });

  const statusConfig = getStatusConfig(t);

  // Read receipt indicator
  const ReadReceipt = ({ msg }: { msg: Message }) => {
    if (msg.sender_role !== 'super_admin') return null;
    return (
      <span className="inline-flex ml-1">
        {msg.read_at ? (
          <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
        ) : (
          <Check className="w-3.5 h-3.5 text-white/30" />
        )}
      </span>
    );
  };

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
  const openCount = tickets.filter(t => t.status === 'open').length;

  // Chat view
  if (selectedTicket) {
    const storeName = getStoreName(selectedTicket);
    const status = statusConfig[selectedTicket.status] || statusConfig.open;
    return (
      <SuperAdminLayout title={t('superAdmin.support.chat')}>
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="mb-4 gap-2 text-white/60 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> {t('common.back')}
          </Button>

          <div className="rounded-xl border border-purple-500/20 bg-black/50 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
            {/* Header with platform info */}
            <div className="p-4 border-b border-purple-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{selectedTicket.subject}</h3>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {storeName && (
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Store className="w-3 h-3" /> {storeName}
                      </span>
                    )}
                    {selectedTicket.creator_email && (
                      <span className="text-xs text-white/40 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {selectedTicket.creator_email}
                      </span>
                    )}
                    <span className="text-xs text-white/30">
                      {format(new Date(selectedTicket.created_at), "dd MMM yyyy")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={status.color}>{status.label}</Badge>
                  {selectedTicket.status !== 'closed' && (
                    <Button variant="ghost" size="sm" onClick={() => closeTicket.mutate()} className="text-red-400/70 hover:text-red-400 text-xs">
                      <XCircle className="w-4 h-4 mr-1" /> {t('superAdmin.support.close')}
                    </Button>
                  )}
                </div>
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
                      {!isMe && (
                        <p className="text-[10px] font-semibold text-purple-300 mb-1">
                          {storeName ? t('superAdmin.support.creatorFrom', { store: storeName }) : t('superAdmin.support.creator')}
                        </p>
                      )}
                      {isMe && <p className="text-[10px] font-semibold text-purple-200 mb-1">{t('superAdmin.support.you')}</p>}
                      <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                      <div className={`flex items-center gap-0.5 mt-1 ${isMe ? 'justify-end' : ''}`}>
                        <span className={`text-[10px] ${isMe ? 'text-white/50' : 'text-white/30'}`}>
                          {format(new Date(m.created_at), 'HH:mm')}
                        </span>
                        <ReadReceipt msg={m} />
                      </div>
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
                  placeholder={t('superAdmin.support.replyPlaceholder')}
                  className="bg-white/5 border-white/10 text-white"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (replyText.trim()) sendReply.mutate(); } }}
                />
                <Button onClick={() => sendReply.mutate()} disabled={!replyText.trim() || sendReply.isPending} size="icon" className="bg-purple-600 hover:bg-purple-700">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="p-3 border-t border-purple-500/10 text-center text-sm text-white/40">
                {t('superAdmin.support.ticketClosedMsg')}
              </div>
            )}
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  // Ticket list
  return (
    <SuperAdminLayout title={t('superAdmin.support.title')}>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-white/50">
            {openCount > 0 ? t('superAdmin.support.openTickets', { count: openCount }) : t('superAdmin.support.noOpenTickets')}
          </p>
          <div className="flex gap-1">
            {(['all', 'open', 'answered', 'closed'] as const).map(f => (
              <Button key={f} variant={filter === f ? 'default' : 'ghost'} size="sm"
                className={filter === f ? 'bg-purple-600' : 'text-white/50'}
                onClick={() => setFilter(f)}>
                {f === 'all' ? t('superAdmin.support.filterAll') : statusConfig[f]?.label || f}
              </Button>
            ))}
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-purple-500/20 p-12 text-center">
            <MessageCircle className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">{t('superAdmin.support.noTicketsFound')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTickets.map((t) => {
              const status = statusConfig[t.status] || statusConfig.open;
              const StatusIcon = status.icon;
              const storeName = getStoreName(t);
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className="w-full text-left rounded-xl border border-purple-500/10 bg-black/30 p-4 hover:border-purple-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white truncate">{t.subject}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {storeName && (
                          <span className="text-xs bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Store className="w-3 h-3" /> {storeName}
                          </span>
                        )}
                        {t.creator_email && (
                          <span className="text-xs text-white/30 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {t.creator_email}
                          </span>
                        )}
                        <span className="text-xs text-white/20">
                        {format(new Date(t.updated_at), "dd MMM HH:mm")}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${status.color} shrink-0 gap-1`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </Badge>
                  </div>
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
