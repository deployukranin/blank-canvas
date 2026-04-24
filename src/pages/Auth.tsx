import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, Eye, EyeOff, Sparkles, Palette, BarChart3, Users, Youtube, CheckCircle2, XCircle, Search, DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";


const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading, signIn, signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "login";

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [youtubeHandle, setYoutubeHandle] = useState("");
  const [youtubeVerified, setYoutubeVerified] = useState<null | { channelId: string; channelTitle: string; thumbnailUrl: string }>(null);
  const [youtubeVerifying, setYoutubeVerifying] = useState(false);
  const [youtubeError, setYoutubeError] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);

  const RESERVED_SLUGS = ['admin', 'ceo', 'auth', 'profile', 'api', 'setup', 'login', 'signup', 'vip', 'customs', 'community', 'gallery', 'ideas', 'notifications', 'help', 'audios', 'videos', 'terms', 'privacy', 'subscriptions', 'orders', 'client-auth'];

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) { setSlugAvailable(null); return; }
    if (RESERVED_SLUGS.includes(slug)) { setSlugAvailable(false); return; }
    setSlugChecking(true);
    const { data } = await supabase.from('stores').select('id').eq('slug', slug).maybeSingle();
    setSlugAvailable(!data);
    setSlugChecking(false);
  };

  const features = [
    { icon: DollarSign, title: t("auth.featureNoFee"), desc: t("auth.featureNoFeeDesc") },
    { icon: Palette, title: t("auth.featureCustom"), desc: t("auth.featureCustomDesc") },
    { icon: BarChart3, title: t("auth.featureAdmin"), desc: t("auth.featureAdminDesc") },
    { icon: Users, title: t("auth.featureFans"), desc: t("auth.featureFansDesc") },
    { icon: Sparkles, title: t("auth.featureYoutube"), desc: t("auth.featureYoutubeDesc") },
  ];

  // Redirect if already authenticated — find their store slug
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      redirectToAdminWithSlug();
    }
  }, [isAuthenticated, authLoading]);

  const getStoreSlug = async (userId: string): Promise<string | null> => {
    // 1) Check stores.created_by (most reliable, no join)
    const { data: ownedStore, error: ownedErr } = await supabase
      .from('stores')
      .select('slug')
      .eq('created_by', userId)
      .limit(1)
      .maybeSingle();
    if (ownedErr) console.error('[Auth] getStoreSlug ownedStore error:', ownedErr);
    if (ownedStore?.slug) return ownedStore.slug;

    // 2) Fallback: check store_admins → fetch store separately
    const { data: adminRow, error: adminErr } = await supabase
      .from('store_admins')
      .select('store_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    if (adminErr) console.error('[Auth] getStoreSlug adminRow error:', adminErr);
    if (adminRow?.store_id) {
      const { data: storeRow } = await supabase
        .from('stores')
        .select('slug')
        .eq('id', adminRow.store_id)
        .maybeSingle();
      if (storeRow?.slug) return storeRow.slug;
    }

    return null;
  };

  const redirectToAdminWithSlug = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const slug = await getStoreSlug(authUser.id);
    if (slug) {
      navigate(`/${slug}/admin`, { replace: true });
    } else {
      // User has no store — stay on auth page and show message
      toast.error('Nenhuma loja encontrada para esta conta. Crie uma nova loja ou entre com outra conta.');
    }
  };


  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const verifyYoutubeHandle = async () => {
    const handle = youtubeHandle.trim();
    if (!handle) return;
    
    setYoutubeVerifying(true);
    setYoutubeError("");
    setYoutubeVerified(null);

    try {
      const { data, error } = await supabase.functions.invoke("youtube-videos", {
        body: { channelId: handle, action: "verify" },
      });

      if (error || !data?.success) {
        setYoutubeError(t("auth.youtubeNotFound"));
        return;
      }

      setYoutubeVerified({
        channelId: data.channelId,
        channelTitle: data.channelTitle || "",
        thumbnailUrl: data.thumbnailUrl || "",
      });
    } catch {
      setYoutubeError(t("auth.youtubeVerifyError"));
    } finally {
      setYoutubeVerifying(false);
    }
  };

  const checkUserRoles = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roles = data?.map((r) => r.role) || [];
    return { isAdmin: roles.includes("admin") || roles.includes("ceo") };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(loginEmail)) { toast.error(t("auth.invalidEmail")); return; }
    if (loginPassword.length < 6) { toast.error(t("auth.passwordMin")); return; }

    setIsSubmitting(true);
    const result = await signIn(loginEmail, loginPassword);

    if (result.success) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const slug = await getStoreSlug(user.id);
        if (slug) {
          toast.success(t("auth.welcomeAdmin"));
          navigate(`/${slug}/admin`, { replace: true });
        } else {
          toast.error('Nenhuma loja encontrada para esta conta.');
        }
      } else {
        toast.error('Erro ao obter sessão. Tente novamente.');
      }
    } else {
      toast.error(result.error || t("auth.errorLoggingIn"));
    }
    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !storeSlug.trim()) { toast.error(t("auth.storeNameRequired")); return; }
    if (storeSlug.length < 3) { toast.error(t("auth.slugTooShort")); return; }
    if (slugAvailable === false) { toast.error(t("auth.slugUnavailable")); return; }
    if (!validateEmail(signupEmail)) { toast.error(t("auth.invalidEmail")); return; }
    if (signupPassword.length < 6) { toast.error(t("auth.passwordMin")); return; }
    if (signupPassword !== signupConfirmPassword) { toast.error(t("auth.passwordMismatch")); return; }

    setIsSubmitting(true);
    try {
      const result = await signUp(signupEmail, signupPassword);

      if (!result.success) {
        toast.error(result.error || t("auth.errorCreatingAccount"));
        setIsSubmitting(false);
        return;
      }

      // Wait a moment for session to establish after auto-confirm
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get session - try multiple times since auto-confirm might take a moment
      let userId: string | null = null;
      for (let i = 0; i < 3; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          userId = session.user.id;
          break;
        }
        // If no session yet, try signing in directly
        if (i === 1) {
          const { data } = await supabase.auth.signInWithPassword({
            email: signupEmail,
            password: signupPassword,
          });
          if (data?.session?.user?.id) {
            userId = data.session.user.id;
            break;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!userId) {
        toast.error("Erro ao obter sessão. Tente fazer login.");
        navigate("/auth", { replace: true });
        setIsSubmitting(false);
        return;
      }

      // Create store
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert({
          name: storeName.trim(),
          slug: storeSlug,
          created_by: userId,
        })
        .select()
        .single();

      if (storeError) {
        console.error('Error creating store:', storeError);
        toast.error("Erro ao criar loja: " + storeError.message);
        setIsSubmitting(false);
        return;
      }

      if (store) {
        // Link admin role and store_admins
        const [adminResult, roleResult] = await Promise.all([
          supabase.from('store_admins').insert({ store_id: store.id, user_id: userId }),
          supabase.from('user_roles').insert({ user_id: userId, role: 'admin' as any }),
        ]);

        if (adminResult.error) console.error('store_admins error:', adminResult.error);
        if (roleResult.error) console.error('user_roles error:', roleResult.error);

        // Save youtube channel if verified - use edge function to bypass RLS timing issues
        if (youtubeVerified) {
          const { error: ytError } = await supabase.functions.invoke('save-app-config', {
            body: {
              config_key: 'youtube_channel',
              config_value: { channelId: youtubeVerified.channelId, channelTitle: youtubeVerified.channelTitle },
              store_id: store.id,
            },
          });
          if (ytError) console.error('youtube_channel save error:', ytError);

          // Save YouTube channel thumbnail as creator's avatar
          if (youtubeVerified.thumbnailUrl) {
            // Update store avatar
            await supabase.from('stores').update({ avatar_url: youtubeVerified.thumbnailUrl }).eq('id', store.id);
            // Create/update profile with YouTube avatar
            await supabase.from('profiles').upsert({
              user_id: userId,
              avatar_url: youtubeVerified.thumbnailUrl,
              display_name: storeName.trim(),
            }, { onConflict: 'user_id' });
          }
        }
      }

      toast.success(t("auth.accountCreated"));
      navigate(`/${storeSlug}/admin`, { replace: true });
    } catch (err) {
      console.error('Signup error:', err);
      toast.error(t("auth.errorCreatingAccount"));
    }
    setIsSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0a0a0a] relative" style={{ '--ring': '263 70% 58%', '--primary': '263 70% 58%', '--input': '0 0% 12%' } as React.CSSProperties}>
      {/* Language selector — top right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector variant="minimal" />
      </div>

      {/* Left side — Branding / Features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-[#0a0a0a] to-[#0a0a0a]" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10 flex flex-col justify-center px-16 py-12 w-full">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-xl tracking-tight font-['Space_Grotesk']">
                Creator Platform
              </span>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4 leading-tight font-['Space_Grotesk']">
              {t("auth.heroTitle1")}
              <br />
              <span className="text-purple-400">{t("auth.heroTitle2")}</span>
            </h1>

            <p className="text-gray-400 text-lg mb-6 max-w-md">
              {t("auth.heroDesc")}
            </p>

            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-5 py-2.5 mb-12">
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-semibold text-sm">{t("auth.trialBadge")}</span>
            </div>

            <div className="space-y-6">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">{feature.title}</h3>
                    <p className="text-gray-500 text-sm">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side — Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg font-['Space_Grotesk']">Creator Platform</span>
          </div>

          <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white font-['Space_Grotesk']">
                {defaultTab === "signup" ? t("auth.creatorSignup") : t("auth.creatorLogin")}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {defaultTab === "signup" ? t("auth.creatorSignupDesc") : t("auth.creatorLoginDesc")}
              </p>
            </div>

            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/[0.04] border border-white/[0.06]">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400"
                >
                  {t("auth.loginTab")}
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400"
                >
                  {t("auth.signupTab")}
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">

                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-gray-300 text-sm">{t("common.email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder={t("auth.emailPlaceholder")}
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 focus-visible:ring-purple-500/20 focus-visible:border-purple-500 focus:ring-0"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-gray-300 text-sm">{t("common.password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 focus-visible:ring-purple-500/20 focus-visible:border-purple-500 focus:ring-0"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <a
                      href="/forgot-password"
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      Esqueci minha senha
                    </a>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium h-11"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {t("auth.loginTab")}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">

                  {/* Store Name */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-store-name" className="text-gray-300 text-sm">
                      {t("auth.storeName")} <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="signup-store-name"
                      type="text"
                      placeholder={t("auth.storeNamePlaceholder")}
                      value={storeName}
                      onChange={(e) => {
                        setStoreName(e.target.value);
                        const slug = generateSlug(e.target.value);
                        setStoreSlug(slug);
                        setSlugAvailable(null);
                        if (slug.length >= 3) checkSlugAvailability(slug);
                      }}
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 focus-visible:ring-purple-500/20 focus-visible:border-purple-500 focus:ring-0"
                      required
                    />
                  </div>

                  {/* Store Slug */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-slug" className="text-gray-300 text-sm">
                      {t("auth.storeSlug")} <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">/</span>
                      <Input
                        id="signup-slug"
                        type="text"
                        placeholder="my-store"
                        value={storeSlug}
                        onChange={(e) => {
                          const slug = generateSlug(e.target.value);
                          setStoreSlug(slug);
                          setSlugAvailable(null);
                          if (slug.length >= 3) checkSlugAvailability(slug);
                        }}
                        className="pl-7 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 focus-visible:ring-purple-500/20 focus-visible:border-purple-500 focus:ring-0"
                        required
                      />
                      {slugChecking && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
                      {!slugChecking && slugAvailable === true && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />}
                      {!slugChecking && slugAvailable === false && <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />}
                    </div>
                    {slugAvailable === false && (
                      <p className="text-xs text-red-400">{t("auth.slugUnavailable")}</p>
                    )}
                    {slugAvailable === true && (
                      <p className="text-xs text-green-400">{t("auth.slugAvailable")}</p>
                    )}
                    <p className="text-xs text-gray-500">{t("auth.slugHint")}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-gray-300 text-sm">{t("common.email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder={t("auth.emailPlaceholder")}
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 focus-visible:ring-purple-500/20 focus-visible:border-purple-500 focus:ring-0"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-gray-300 text-sm">{t("common.password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10 pr-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 focus-visible:ring-purple-500/20 focus-visible:border-purple-500 focus:ring-0"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm" className="text-gray-300 text-sm">{t("auth.confirmPassword")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="signup-confirm"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 focus-visible:ring-purple-500/20 focus-visible:border-purple-500 focus:ring-0"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-youtube" className="text-gray-300 text-sm">
                      {t("auth.youtubeChannel")} <span className="text-gray-500 font-normal">({t("auth.youtubeOptional")})</span>
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                          id="signup-youtube"
                          type="text"
                          placeholder="@yourchannel"
                          value={youtubeHandle}
                          onChange={(e) => {
                            setYoutubeHandle(e.target.value);
                            setYoutubeVerified(null);
                            setYoutubeError("");
                          }}
                          className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 focus-visible:ring-purple-500/20 focus-visible:border-purple-500 focus:ring-0"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={verifyYoutubeHandle}
                        disabled={youtubeVerifying || !youtubeHandle.trim()}
                        className="border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 h-10 w-10 flex-shrink-0"
                      >
                        {youtubeVerifying ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {/* Verified channel preview */}
                    {youtubeVerified && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                      >
                        {youtubeVerified.thumbnailUrl && (
                          <img
                            src={youtubeVerified.thumbnailUrl}
                            alt={youtubeVerified.channelTitle}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-green-400 font-medium truncate">
                            {youtubeVerified.channelTitle}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{youtubeVerified.channelId}</p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                      </motion.div>
                    )}

                    {/* Error */}
                    {youtubeError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                      >
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <p className="text-sm text-red-400">{youtubeError}</p>
                      </motion.div>
                    )}

                    <p className="text-xs text-gray-500">
                      {t("auth.youtubeHint")}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium h-11"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {t("auth.createAccount")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-center text-xs text-gray-600 mt-6">
              {t("auth.terms")}{" "}
              <a href="/terms" className="text-purple-400 hover:underline">{t("auth.termsOfUse")}</a>{" "}
              {t("auth.and")}{" "}
              <a href="/privacy" className="text-purple-400 hover:underline">{t("auth.privacyPolicy")}</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
