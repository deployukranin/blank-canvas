import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Globe, CheckCircle2, AlertCircle, Loader2, Trash2, RefreshCw, ExternalLink, Headset } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const PRODUCTION_DOMAIN = 'www.mytinglebox.com';
const VERCEL_NAMESERVERS = ['ns1.vercel-dns.com', 'ns2.vercel-dns.com'];
const AUTO_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface DomainState {
  customDomain: string | null;
  domainVerified: boolean;
  domainAddedAt: string | null;
}

interface VerificationRecord {
  type: string;
  domain: string;
  value: string;
  reason: string;
}

interface DomainFunctionResult {
  success?: boolean;
  error?: string;
  domain?: string;
  verified?: boolean;
  verification?: VerificationRecord[] | null;
  misconfigured?: boolean;
  existing?: boolean;
  dnsMode?: 'nameservers' | 'records';
  nameservers?: string[];
}

const AdminDominio: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { store: tenantStore, basePath } = useTenant();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ownStore, setOwnStore] = useState<typeof tenantStore>(null);
  const store = ownStore || tenantStore;

  // Resolve user's own store (creator may be on a different tenant's URL)
  useEffect(() => {
    if (!user?.id) return;
    const resolveOwnStore = async () => {
      // First check store_admins
      const { data: adminEntry } = await supabase
        .from('store_admins')
        .select('store_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const storeId = adminEntry?.store_id;
      if (!storeId) return;

      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();
      
      if (storeData) {
        setOwnStore(storeData as typeof tenantStore);
      }
    };
    resolveOwnStore();
  }, [user?.id]);
  const [domain, setDomain] = useState('');
  const [domainState, setDomainState] = useState<DomainState>({
    customDomain: null,
    domainVerified: false,
    domainAddedAt: null,
  });
  const [verification, setVerification] = useState<VerificationRecord[] | null>(null);
  const [misconfigured, setMisconfigured] = useState(false);
  const [dnsMode, setDnsMode] = useState<'nameservers' | 'records'>('nameservers');
  const [nameservers, setNameservers] = useState<string[]>(VERCEL_NAMESERVERS);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastAutoCheck, setLastAutoCheck] = useState<Date | null>(null);
  const [nextAutoCheck, setNextAutoCheck] = useState<Date | null>(null);
  const autoCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (store?.id) loadDomainState();
  }, [store?.id]);

  const applyDomainResponse = (result: DomainFunctionResult | null) => {
    setVerification(Array.isArray(result?.verification) ? result.verification : null);
    setMisconfigured(Boolean(result?.misconfigured));
    setDnsMode(result?.dnsMode === 'records' ? 'records' : 'nameservers');
    setNameservers(Array.isArray(result?.nameservers) && result.nameservers.length > 0 ? result.nameservers : VERCEL_NAMESERVERS);
  };

  const silentVerify = useCallback(async () => {
    if (!store?.id) return;
    try {
      const result = await callDomainFunction('verify');
      if (result?.success) {
        setDomainState((prev) => ({ ...prev, domainVerified: Boolean(result.verified) }));
        applyDomainResponse(result);
        setLastAutoCheck(new Date());
        setNextAutoCheck(new Date(Date.now() + AUTO_CHECK_INTERVAL_MS));

        if (result.verified) {
          toast({ title: '🎉 ' + t('admin.domain.verified', 'Domain verified! ✅') });
          setVerification(null);
          // Stop polling once verified
          if (autoCheckRef.current) {
            clearInterval(autoCheckRef.current);
            autoCheckRef.current = null;
            setNextAutoCheck(null);
          }
        }
      }
    } catch {
      // silent fail for auto-check
    }
  }, [store?.id]);

  // Auto-check every 5 minutes while domain is pending
  useEffect(() => {
    if (domainState.customDomain && !domainState.domainVerified) {
      void silentVerify();
      autoCheckRef.current = setInterval(silentVerify, AUTO_CHECK_INTERVAL_MS);
      setNextAutoCheck(new Date(Date.now() + AUTO_CHECK_INTERVAL_MS));

      return () => {
        if (autoCheckRef.current) {
          clearInterval(autoCheckRef.current);
          autoCheckRef.current = null;
        }
      };
    }

    if (autoCheckRef.current) {
      clearInterval(autoCheckRef.current);
      autoCheckRef.current = null;
    }
    setNextAutoCheck(null);
  }, [domainState.customDomain, domainState.domainVerified, silentVerify]);

  const loadDomainState = async () => {
    if (!store?.id) return;

    const { data } = await supabase
      .from('stores')
      .select('custom_domain, domain_verified, domain_added_at')
      .eq('id', store.id)
      .single();

    if (data) {
      setDomainState({
        customDomain: (data as any).custom_domain,
        domainVerified: (data as any).domain_verified,
        domainAddedAt: (data as any).domain_added_at,
      });

      if ((data as any).custom_domain) {
        setDomain((data as any).custom_domain);
      }
    }

    setLoading(false);
  };

  const callDomainFunction = async (action: string, domainValue?: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast({ title: 'Not authenticated', variant: 'destructive' });
      return null;
    }

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const res = await fetch(`https://${projectId}.supabase.co/functions/v1/manage-domain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action,
        store_id: store?.id,
        domain: domainValue,
      }),
    });

    const result = await res.json();
    return result as DomainFunctionResult;
  };

  const handleAddDomain = async () => {
    if (!domain.trim()) {
      toast({ title: t('admin.domain.enterDomain', 'Enter a domain'), variant: 'destructive' });
      return;
    }

    setActionLoading(true);
    const result = await callDomainFunction('add', domain.trim());
    setActionLoading(false);

    if (result?.success) {
      toast({
        title: result.existing
          ? t('admin.domain.addedExisting', 'Domínio vinculado. Agora configure o DNS para concluir.')
          : t('admin.domain.added', 'Domínio adicionado. Agora configure o DNS para concluir.'),
      });

      setDomainState({
        customDomain: result.domain ?? domain.trim(),
        domainVerified: Boolean(result.verified),
        domainAddedAt: new Date().toISOString(),
      });
      applyDomainResponse(result);
      return;
    }

    toast({ title: result?.error || 'Error adding domain', variant: 'destructive' });
  };

  const handleVerify = async () => {
    setActionLoading(true);
    const result = await callDomainFunction('verify');
    setActionLoading(false);

    if (result?.success) {
      setDomainState((prev) => ({ ...prev, domainVerified: Boolean(result.verified) }));
      applyDomainResponse(result);

      if (result.verified) {
        toast({ title: t('admin.domain.verified', 'Domain verified! ✅') });
        setVerification(null);
      } else {
        toast({ title: t('admin.domain.notYetVerified', 'Domain not verified yet. Check DNS settings.'), variant: 'destructive' });
      }
      return;
    }

    toast({ title: result?.error || 'Error verifying', variant: 'destructive' });
  };

  const handleRemove = async () => {
    if (!confirm(t('admin.domain.confirmRemove', 'Are you sure you want to remove this domain?'))) return;

    setActionLoading(true);
    const result = await callDomainFunction('remove');
    setActionLoading(false);

    if (result?.success) {
      toast({ title: t('admin.domain.removed', 'Domain removed') });
      setDomainState({ customDomain: null, domainVerified: false, domainAddedAt: null });
      setDomain('');
      setVerification(null);
      setMisconfigured(false);
      return;
    }

    toast({ title: result?.error || 'Error removing', variant: 'destructive' });
  };

  if (loading) {
    return (
      <AdminLayout title={t('admin.domain.title', 'Custom Domain')}>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  const hasDomain = !!domainState.customDomain;

  return (
    <AdminLayout title={t('admin.domain.title', 'Custom Domain')}>
      <div className="max-w-2xl mx-auto space-y-6">
        <GlassCard className="p-5">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">
                {t('admin.domain.description', 'Connect your own domain to your store. Your fans will access your platform through your custom address instead of the default URL.')}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {t('admin.domain.currentUrl', 'Current URL')}: <span className="font-mono text-foreground">{PRODUCTION_DOMAIN}/{store?.slug}</span>
              </p>
            </div>
          </div>
        </GlassCard>

        {hasDomain ? (
          <>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-semibold text-lg">{domainState.customDomain}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {domainState.domainVerified ? (
                        <Badge variant="outline" className="gap-1 border-primary/20 bg-primary/10 text-primary">
                          <CheckCircle2 className="w-3 h-3" />
                          {t('admin.domain.active', 'Active')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 border-border bg-muted text-muted-foreground">
                          <AlertCircle className="w-3 h-3" />
                          {t('admin.domain.pendingVerification', 'Pending DNS')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!domainState.domainVerified && (
                    <Button size="sm" variant="outline" onClick={handleVerify} disabled={actionLoading} className="gap-2">
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      {t('admin.domain.checkDns', 'Check DNS')}
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={handleRemove} disabled={actionLoading} className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    {t('admin.domain.remove', 'Remove')}
                  </Button>
                </div>
              </div>

              {domainState.domainVerified && (
                <div className="mt-3 rounded-lg border border-primary/20 bg-primary/10 p-3">
                  <p className="flex items-center gap-2 text-sm text-primary">
                    <CheckCircle2 className="w-4 h-4" />
                    {t('admin.domain.liveMessage', 'Your domain is live and serving your platform!')}
                  </p>
                  <a
                    href={`https://${domainState.customDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary flex items-center gap-1 mt-2 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> https://{domainState.customDomain}
                  </a>
                </div>
              )}
            </GlassCard>

            {!domainState.domainVerified && (
              <GlassCard className="p-5 space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  {t('admin.domain.dnsInstructions', 'Configuração DNS pendente')}
                </h3>

                <p className="text-sm text-muted-foreground">
                  {dnsMode === 'nameservers'
                    ? t('admin.domain.nameserverIntro', 'No seu provedor de domínio, troque os nameservers do domínio por estes nameservers da Vercel:')
                    : t('admin.domain.recordsIntro', 'No DNS do seu domínio, crie os registros abaixo para apontar para a Vercel:')}
                </p>

                {dnsMode === 'nameservers' ? (
                  <div className="space-y-2">
                    {nameservers.map((server) => (
                      <div key={server} className="rounded-lg border border-border/30 bg-background/50 p-3">
                        <p className="text-xs text-muted-foreground">Nameserver</p>
                        <p className="font-mono text-sm font-semibold break-all">{server}</p>
                      </div>
                    ))}
                  </div>
                ) : verification && verification.length > 0 ? (
                  <div className="space-y-2">
                    {verification.map((item, index) => (
                      <div key={`${item.type}-${item.domain}-${index}`} className="rounded-lg border border-border/30 bg-background/50 p-3">
                        <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-3">
                          <div>
                            <p className="text-muted-foreground">Type</p>
                            <p className="font-mono font-semibold">{item.type}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Name</p>
                            <p className="font-mono font-semibold break-all">{item.domain}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Value</p>
                            <p className="font-mono font-semibold break-all">{item.value}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/30 bg-background/50 p-3 text-sm text-muted-foreground">
                    {t('admin.domain.awaitingRecords', 'A Vercel ainda não retornou registros detalhados. Se o domínio estiver novo no projeto, use nameservers da Vercel ou clique em “Check DNS” após salvar as alterações no seu provedor.')}
                  </div>
                )}

                {misconfigured && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {t('admin.domain.misconfigured', 'O domínio ainda está configurado incorretamente no provedor. Ajuste os dados acima e depois clique em “Check DNS”.')}
                  </div>
                )}

                <div className="rounded-lg border border-border/30 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">
                    ⏳ {t('admin.domain.autoCheckNote', 'Verificação automática a cada 5 minutos. Você será notificado quando o domínio estiver ativo.')}
                    {lastAutoCheck && (
                      <span className="ml-1 text-foreground/50">
                        — {t('admin.domain.lastCheck', 'Última verificação')}: {lastAutoCheck.toLocaleTimeString()}
                      </span>
                    )}
                    {nextAutoCheck && (
                      <span className="ml-1 text-foreground/50">
                        — {t('admin.domain.nextCheck', 'Próxima verificação')}: {nextAutoCheck.toLocaleTimeString()}
                      </span>
                    )}
                  </p>
                </div>
              </GlassCard>
            )}
          </>
        ) : (
          <GlassCard className="p-6 space-y-4">
            <Label className="text-sm font-medium">{t('admin.domain.yourDomain', 'Your Domain')}</Label>
            <div className="flex gap-3">
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="meustudio.com.br"
                className="flex-1 bg-background/50 border-border/30"
              />
              <Button onClick={handleAddDomain} disabled={actionLoading} className="gap-2">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                {t('admin.domain.connect', 'Connect')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('admin.domain.hint', 'Enter the domain you want to use (e.g., meusite.com.br). You need to own this domain and have access to its DNS settings.')}
            </p>
          </GlassCard>
        )}

        {/* Support shortcuts */}
        <GlassCard className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Headset className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold">{t('admin.domain.needHelp', 'Precisa de ajuda?')}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('admin.domain.supportDesc', 'Selecione o assunto abaixo para abrir um ticket de suporte com nosso time:')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { label: t('admin.domain.supportDnsConfig', 'Não sei configurar o DNS'), subject: 'Domínio: Não sei configurar o DNS' },
              { label: t('admin.domain.supportNotVerifying', 'Domínio não verifica'), subject: 'Domínio: Meu domínio não está verificando' },
              { label: t('admin.domain.supportSsl', 'SSL / Site não seguro'), subject: 'Domínio: SSL não está funcionando (site inseguro)' },
              { label: t('admin.domain.supportNotLoading', 'Site não carrega no domínio'), subject: 'Domínio: Meu site não carrega no domínio personalizado' },
              { label: t('admin.domain.supportCloudflare', 'Uso Cloudflare / Proxy'), subject: 'Domínio: Preciso de ajuda com Cloudflare / Proxy DNS' },
              { label: t('admin.domain.supportOther', 'Outro problema'), subject: 'Domínio: Outro problema' },
            ].map((item) => (
              <Button
                key={item.subject}
                variant="outline"
                size="sm"
                className="justify-start text-left h-auto py-2.5 px-3 text-xs"
                onClick={() => navigate(`${basePath}/admin/support`, { state: { prefillSubject: item.subject } })}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </GlassCard>
      </div>
    </AdminLayout>
  );
};
};

export default AdminDominio;
