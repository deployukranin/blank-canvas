import React, { useEffect, useState } from 'react';
import { Globe, CheckCircle2, AlertCircle, Loader2, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';

const PRODUCTION_DOMAIN = 'www.mytinglebox.com';
const VERCEL_NAMESERVERS = ['ns1.vercel-dns.com', 'ns2.vercel-dns.com'];

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
}

const AdminDominio: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { store } = useTenant();
  const [domain, setDomain] = useState('');
  const [domainState, setDomainState] = useState<DomainState>({
    customDomain: null,
    domainVerified: false,
    domainAddedAt: null,
  });
  const [verification, setVerification] = useState<VerificationRecord[] | null>(null);
  const [misconfigured, setMisconfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (store?.id) loadDomainState();
  }, [store?.id]);

  const applyDomainResponse = (result: DomainFunctionResult | null) => {
    setVerification(Array.isArray(result?.verification) ? result.verification : null);
    setMisconfigured(Boolean(result?.misconfigured));
  };

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
          ? t('admin.domain.addedExisting', 'Domain linked. It was already added in Vercel.')
          : t('admin.domain.added', 'Domain added successfully!'),
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
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  {t('admin.domain.dnsInstructions', 'DNS Configuration Required')}
                </h3>

                <p className="text-xs text-muted-foreground">
                  {t('admin.domain.dnsDescription', 'Use only one method. If the domain already appears inside Vercel, the fastest path is changing the nameservers to Vercel DNS.')}
                </p>

                {misconfigured && (
                  <div className="rounded-lg border border-border/30 bg-muted/30 p-3 text-xs text-muted-foreground">
                    {t('admin.domain.misconfiguredHelp', 'Vercel detected an invalid configuration. If your domain is already registered there, switch your registrar nameservers to the Vercel servers below and wait for propagation.')}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="rounded-lg border border-border/30 bg-background/50 p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold">{t('admin.domain.vercelDnsTitle', 'Option 1 — Vercel DNS (recommended)')}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('admin.domain.vercelDnsDescription', 'If the domain is already added in Vercel, update the nameservers at your registrar to these values:')}
                      </p>
                    </div>

                    {VERCEL_NAMESERVERS.map((nameserver, index) => (
                      <div key={nameserver} className="rounded-lg border border-border/30 bg-background/50 p-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">{t('admin.domain.server', 'Server')}</p>
                            <p className="font-mono font-semibold">NS{index + 1}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('admin.domain.value', 'Value')}</p>
                            <p className="font-mono font-semibold break-all">{nameserver}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-border/30 bg-background/50 p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold">{t('admin.domain.recordsTitle', 'Option 2 — Keep DNS at your registrar')}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('admin.domain.recordsDescription', 'If you do not want to use Vercel DNS, keep your current provider and add these records instead:')}
                      </p>
                    </div>

                    <div className="bg-background/50 rounded-lg p-3 border border-border/30">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-mono font-semibold">A</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Name</p>
                          <p className="font-mono font-semibold">@</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Value</p>
                          <p className="font-mono font-semibold">76.76.21.21</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-background/50 rounded-lg p-3 border border-border/30">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-mono font-semibold">CNAME</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Name</p>
                          <p className="font-mono font-semibold">www</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Value</p>
                          <p className="font-mono font-semibold">cname.vercel-dns.com</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {verification && verification.length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-muted-foreground mt-2">
                        {t('admin.domain.verificationRecords', 'Verification records returned by Vercel:')}
                      </p>
                      {verification.map((item, index) => (
                        <div key={`${item.type}-${item.domain}-${index}`} className="rounded-lg border border-border/30 bg-background/50 p-3">
                          <div className="grid grid-cols-3 gap-2 text-xs">
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
                          {item.reason && <p className="mt-2 text-xs text-muted-foreground">{item.reason}</p>}
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  ⏳ {t('admin.domain.propagationNote', 'DNS changes can take up to 48 hours to propagate. After updating, click "Check DNS" again.')}
                </p>
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
      </div>
    </AdminLayout>
  );
};

export default AdminDominio;
