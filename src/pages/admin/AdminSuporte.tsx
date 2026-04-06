import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Plus, ArrowLeft, MessageCircle, Clock, CheckCircle2, Check, CheckCheck, Globe, CreditCard, Video, Settings, ShieldAlert, HelpCircle, Users, Crown, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  store_id: string | null;
  store_name: string | null;
  creator_email: string | null;
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

const getStatusConfig = (t: any) => ({
  open: { label: t('admin.support.statusOpen'), color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  answered: { label: t('admin.support.statusAnswered'), color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: MessageCircle },
  closed: { label: t('admin.support.statusClosed'), color: 'bg-muted text-muted-foreground border-border', icon: CheckCircle2 },
});

const AdminSuporte = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const prefillSubject = (location.state as any)?.prefillSubject as string | undefined;
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(!!prefillSubject);
  const [newSubject, setNewSubject] = useState(prefillSubject || '');
  const [newMessage, setNewMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's store info
  const { data: storeInfo } = useQuery({
    queryKey: ['admin-store-info', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data: sa } = await supabase
        .from('store_admins')
        .select('store_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      const storeId = sa?.store_id;
      if (!storeId) {
        const { data: store } = await supabase
          .from('stores')
          .select('id, name')
          .eq('created_by', user.id)
          .limit(1)
          .maybeSingle();
        return store ? { id: store.id, name: store.name } : null;
      }
      const { data: store } = await supabase.from('stores').select('id, name').eq('id', storeId).maybeSingle();
      return store ? { id: store.id, name: store.name } : null;
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

  // Mark super_admin messages as read when creator opens the chat
  useEffect(() => {
    if (!selectedTicket?.id || !user?.id) return;
    const unreadFromAdmin = messages.filter(m => m.sender_role === 'super_admin' && !m.read_at);
    if (unreadFromAdmin.length > 0) {
      const ids = unreadFromAdmin.map(m => m.id);
      supabase
        .from('support_messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', ids)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['support-messages', selectedTicket.id] });
        });
    }
  }, [selectedTicket?.id, messages, user?.id, queryClient]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!selectedTicket?.id) return;
    const channel = supabase
      .channel(`support-${selectedTicket.id}`)
      .on('postgres_changes', {
        event: '*',
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
        .insert({
          user_id: user!.id,
          subject: newSubject.trim(),
          store_id: storeInfo?.id ?? null,
          store_name: storeInfo?.name ?? null,
          creator_email: user!.email ?? null,
        })
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
      toast.success(t('admin.support.ticketCreated'));
    },
    onError: () => toast.error(t('admin.support.ticketError')),
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
      if (selectedTicket!.status === 'answered') {
        await supabase.from('support_tickets').update({ status: 'open', updated_at: new Date().toISOString() }).eq('id', selectedTicket!.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-messages', selectedTicket!.id] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setReplyText('');
    },
    onError: () => toast.error(t('admin.support.sendError')),
  });

  // Read receipt indicator
  const ReadReceipt = ({ msg }: { msg: Message }) => {
    if (msg.sender_role !== 'creator') return null;
    return (
      <span className="inline-flex ml-1">
        {msg.read_at ? (
          <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
        ) : (
          <Check className="w-3.5 h-3.5 text-primary-foreground/40" />
        )}
      </span>
    );
  };

  const statusConfig = getStatusConfig(t);

  // Chat view
  if (selectedTicket) {
    const status = statusConfig[selectedTicket.status] || statusConfig.open;
    return (
      <AdminLayout title={t('admin.support.title')}>
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" /> {t('common.back')}
          </Button>

          <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{selectedTicket.subject}</h3>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(selectedTicket.created_at), "dd MMM yyyy HH:mm")}
                </p>
              </div>
              <Badge variant="outline" className={status.color}>{status.label}</Badge>
            </div>

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
                      {!isMe && <p className="text-[10px] font-semibold text-accent mb-1">{t('admin.support.supportTeam')}</p>}
                      <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                      <div className={`flex items-center gap-0.5 mt-1 ${isMe ? 'justify-end' : ''}`}>
                        <span className={`text-[10px] ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
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

            {selectedTicket.status !== 'closed' ? (
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('admin.support.replyPlaceholder')}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (replyText.trim()) sendReply.mutate(); } }}
                />
                <Button onClick={() => sendReply.mutate()} disabled={!replyText.trim() || sendReply.isPending} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="p-3 border-t border-border text-center text-sm text-muted-foreground">
                {t('admin.support.ticketClosed')}
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
      <AdminLayout title={t('admin.support.newTicket')}>
        <div className="max-w-lg mx-auto space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setShowNewTicket(false)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> {t('common.back')}
          </Button>
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            {storeInfo && (
              <div className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                {t('admin.support.platform')}: <span className="font-medium text-foreground">{storeInfo.name}</span>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('admin.support.subject')}</label>
              <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder={t('admin.support.subjectPlaceholder')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('admin.support.message')}</label>
              <Textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={t('admin.support.messagePlaceholder')} rows={5} />
            </div>
            <Button className="w-full" onClick={() => createTicket.mutate()} disabled={!newSubject.trim() || !newMessage.trim() || createTicket.isPending}>
              <Send className="w-4 h-4 mr-2" /> {t('admin.support.sendTicket')}
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Ticket list
  return (
    <AdminLayout title={t('admin.support.title')}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{t('admin.support.sendMessage')}</p>
          <Button onClick={() => setShowNewTicket(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> {t('admin.support.newTicket')}
          </Button>
        </div>

        {/* Support shortcut cards */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-3">{t('admin.support.quickTopics')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: Globe, label: t('admin.support.topicDns'), subject: t('admin.support.topicDnsSubject'), desc: t('admin.support.topicDnsDesc') },
              { icon: ShieldAlert, label: t('admin.support.topicSsl'), subject: t('admin.support.topicSslSubject'), desc: t('admin.support.topicSslDesc') },
              { icon: Globe, label: t('admin.support.topicDomainNotLoading'), subject: t('admin.support.topicDomainNotLoadingSubject'), desc: t('admin.support.topicDomainNotLoadingDesc') },
              { icon: CreditCard, label: t('admin.support.topicPayment'), subject: t('admin.support.topicPaymentSubject'), desc: t('admin.support.topicPaymentDesc') },
              { icon: Video, label: t('admin.support.topicContent'), subject: t('admin.support.topicContentSubject'), desc: t('admin.support.topicContentDesc') },
              { icon: Settings, label: t('admin.support.topicConfig'), subject: t('admin.support.topicConfigSubject'), desc: t('admin.support.topicConfigDesc') },
              { icon: Users, label: t('admin.support.topicUsers'), subject: t('admin.support.topicUsersSubject'), desc: t('admin.support.topicUsersDesc') },
              { icon: Crown, label: t('admin.support.topicVip'), subject: t('admin.support.topicVipSubject'), desc: t('admin.support.topicVipDesc') },
              { icon: HelpCircle, label: t('admin.support.topicOther'), subject: t('admin.support.topicOtherSubject'), desc: t('admin.support.topicOtherDesc') },
            ].map((item) => (
              <button
                key={item.subject}
                onClick={() => { setNewSubject(item.subject); setShowNewTicket(true); }}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-accent/30 transition-colors text-left"
              >
                <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Ticket list */}
        {tickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t('admin.support.noTickets')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((ticket) => {
              const status = statusConfig[ticket.status] || statusConfig.open;
              const StatusIcon = status.icon;
              return (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(ticket.updated_at), "dd MMM yyyy HH:mm")}
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
