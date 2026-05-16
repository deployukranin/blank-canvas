import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WhiteLabelProvider } from "@/contexts/WhiteLabelContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { SuperAdminRoute } from "@/components/auth/SuperAdminRoute";
import { TenantGate } from "@/components/tenant/TenantGate";
import { MyOrdersRedirect } from "@/components/tenant/MyOrdersRedirect";
import CustomDomainResolver from "@/components/tenant/CustomDomainResolver";
import CustomDomainGate from "@/components/tenant/CustomDomainGate";

import Index from "./pages/Index";
import Setup from "./pages/Setup";
import Ideias from "./pages/Ideias";
import VIP from "./pages/VIP";
import Customs from "./pages/Customs";
import Comunidade from "./pages/Comunidade";
import GaleriaVideos from "./pages/GaleriaVideos";
import Perfil from "./pages/Perfil";
import Notificacoes from "./pages/Notificacoes";

import Ajuda from "./pages/Ajuda";
import TermosDeUso from "./pages/TermosDeUso";
import Privacidade from "./pages/Privacidade";
import MeusPedidos from "./pages/MeusPedidos";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ClientAuth from "./pages/ClientAuth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Admin Pages
// AdminLogin removed — admin is now under /:slug/admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminIdeias from "./pages/admin/AdminIdeias";
import AdminPedidos from "./pages/admin/AdminPedidos";
import AdminPagamentosPix from "./pages/admin/AdminPagamentosPix";
import AdminVipPrecos from "./pages/admin/AdminVipPrecos";
import AdminVipConteudo from "./pages/admin/AdminVipConteudo";
import AdminVideos from "./pages/admin/AdminVideos";
import AdminAudios from "./pages/admin/AdminAudios";
import AdminCustoms from "./pages/admin/AdminCustoms";
import AdminYoutube from "./pages/admin/AdminYoutube";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminConteudo from "./pages/admin/AdminConteudo";
import AdminConfiguracoes from "./pages/admin/AdminConfiguracoes";
import AdminPersonalizacao from "./pages/admin/AdminPersonalizacao";
import AdminPlanos from "./pages/admin/AdminPlanos";
import AdminSuporte from "./pages/admin/AdminSuporte";
import AdminSocialLinks from "./pages/admin/AdminSocialLinks";
import AdminDominio from "./pages/admin/AdminDominio";

// Super Admin Pages
import SuperAdminLogin from "./pages/super-admin/SuperAdminLogin";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import SuperAdminTenants from "./pages/super-admin/SuperAdminTenants";
import SuperAdminRanking from "./pages/super-admin/SuperAdminRanking";
import SuperAdminConfiguracoes from "./pages/super-admin/SuperAdminConfiguracoes";
import SuperAdminSuporte from "./pages/super-admin/SuperAdminSuporte";
import SuperAdminPlanos from "./pages/super-admin/SuperAdminPlanos";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <TenantProvider>
          <WhiteLabelProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Rota raiz — custom domain: store home; platform: NotFound */}
                <Route path="/" element={<CustomDomainResolver fallback={<Landing />}><Index /></CustomDomainResolver>} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/help" element={<Ajuda />} />
                <Route path="/terms" element={<TermosDeUso />} />
                <Route path="/privacy" element={<Privacidade />} />
                <Route path="/orders" element={<MyOrdersRedirect />} />

                {/* 🌐 Rotas slug-free para domínios personalizados */}
                <Route path="/login" element={<CustomDomainGate><ClientAuth /></CustomDomainGate>} />
                <Route path="/customs" element={<CustomDomainGate><Customs /></CustomDomainGate>} />
                <Route path="/community" element={<CustomDomainGate><Comunidade /></CustomDomainGate>} />
                <Route path="/ideas" element={<CustomDomainGate><Ideias /></CustomDomainGate>} />
                <Route path="/vip" element={<CustomDomainGate><VIP /></CustomDomainGate>} />
                <Route path="/gallery" element={<CustomDomainGate><GaleriaVideos /></CustomDomainGate>} />
                <Route path="/profile" element={<CustomDomainGate><ProtectedRoute><Perfil /></ProtectedRoute></CustomDomainGate>} />
                <Route path="/notifications" element={<CustomDomainGate><ProtectedRoute><Notificacoes /></ProtectedRoute></CustomDomainGate>} />
                <Route path="/admin" element={<CustomDomainGate><AdminRoute requiredRole="admin"><AdminDashboard /></AdminRoute></CustomDomainGate>} />
                <Route path="/admin/customs" element={<CustomDomainGate><AdminRoute requiredRole="admin"><AdminCustoms /></AdminRoute></CustomDomainGate>} />
                <Route path="/admin/ideas" element={<CustomDomainGate><AdminRoute requiredRole="admin"><AdminIdeias /></AdminRoute></CustomDomainGate>} />
                <Route path="/admin/orders" element={<CustomDomainGate><AdminRoute requiredRole="admin"><AdminPedidos /></AdminRoute></CustomDomainGate>} />
                <Route path="/admin/payments" element={<CustomDomainGate><AdminRoute requiredRole="admin"><AdminPagamentosPix /></AdminRoute></CustomDomainGate>} />
                <Route path="/admin/vip" element={<CustomDomainGate><AdminRoute requiredRole="admin"><AdminVipPrecos /></AdminRoute></CustomDomainGate>} />
                <Route path="/admin/vipcontent" element={<CustomDomainGate><AdminRoute requiredRole="admin"><AdminVipConteudo /></AdminRoute></CustomDomainGate>} />
                <Route path="/admin/videos" element={<CustomDomainGate><AdminRoute requiredRole="admin"><AdminVideos /></AdminRoute></CustomDomainGate>} />
                <Route path="/admin/audios" element={<CustomDomainGate><AdminRoute requiredRole="admin"><AdminAudios /></AdminRoute></CustomDomainGate>} />
                <Route path="/admin/youtube" element={<CustomDomainGate><AdminRoute requiredRole="admin"><AdminYoutube /></AdminRoute></CustomDomainGate>} />
                <Route path="/admin/users" element={<CustomDomainGate><AdminRoute requiredRole="admin"><AdminUsuarios /></AdminRoute></CustomDomainGate>} />
                <Route path="/admin/content" element={<CustomDomainGate><AdminRoute requiredRole="admin"><AdminConteudo /></AdminRoute></CustomDomainGate>} />
                <Route path="/admin/settings" element={<CustomDomainGate><AdminRoute requiredRole="admin"><AdminConfiguracoes /></AdminRoute></CustomDomainGate>} />
                <Route path="/admin/customize" element={<CustomDomainGate><AdminRoute requiredRole="admin"><AdminPersonalizacao /></AdminRoute></CustomDomainGate>} />
                <Route path="/admin/plans" element={<CustomDomainGate><AdminRoute requiredRole="admin"><AdminPlanos /></AdminRoute></CustomDomainGate>} />
                <Route path="/admin/support" element={<CustomDomainGate><AdminRoute requiredRole="admin"><AdminSuporte /></AdminRoute></CustomDomainGate>} />
                <Route path="/admin/social-links" element={<CustomDomainGate><AdminRoute requiredRole="admin"><AdminSocialLinks /></AdminRoute></CustomDomainGate>} />
                <Route path="/admin/domain" element={<CustomDomainGate><AdminRoute requiredRole="admin"><AdminDominio /></AdminRoute></CustomDomainGate>} />

                {/* 🏪 Rotas TENANT (Loja do Criador via slug) */}
                <Route path="/:slug" element={<TenantGate><Index /></TenantGate>} />
                <Route path="/:slug/login" element={<TenantGate><ClientAuth /></TenantGate>} />
                <Route path="/:slug/customs" element={<TenantGate><Customs /></TenantGate>} />
                <Route path="/:slug/community" element={<TenantGate><Comunidade /></TenantGate>} />
                <Route path="/:slug/ideas" element={<TenantGate><Ideias /></TenantGate>} />
                <Route path="/:slug/vip" element={<TenantGate><VIP /></TenantGate>} />
                <Route path="/:slug/gallery" element={<TenantGate><GaleriaVideos /></TenantGate>} />
                <Route path="/:slug/profile" element={<TenantGate><ProtectedRoute><Perfil /></ProtectedRoute></TenantGate>} />
                <Route path="/:slug/orders" element={<TenantGate><ProtectedRoute><MeusPedidos /></ProtectedRoute></TenantGate>} />
                <Route path="/:slug/notifications" element={<TenantGate><ProtectedRoute><Notificacoes /></ProtectedRoute></TenantGate>} />

                {/* 🛡️ Rotas ADMIN (Creator Panel) — scoped by store slug */}
                <Route path="/:slug/admin" element={<TenantGate><AdminRoute requiredRole="admin"><AdminDashboard /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/customs" element={<TenantGate><AdminRoute requiredRole="admin"><AdminCustoms /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/ideas" element={<TenantGate><AdminRoute requiredRole="admin"><AdminIdeias /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/orders" element={<TenantGate><AdminRoute requiredRole="admin"><AdminPedidos /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/payments" element={<TenantGate><AdminRoute requiredRole="admin"><AdminPagamentosPix /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/vip" element={<TenantGate><AdminRoute requiredRole="admin"><AdminVipPrecos /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/vipcontent" element={<TenantGate><AdminRoute requiredRole="admin"><AdminVipConteudo /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/videos" element={<TenantGate><AdminRoute requiredRole="admin"><AdminVideos /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/audios" element={<TenantGate><AdminRoute requiredRole="admin"><AdminAudios /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/youtube" element={<TenantGate><AdminRoute requiredRole="admin"><AdminYoutube /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/users" element={<TenantGate><AdminRoute requiredRole="admin"><AdminUsuarios /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/content" element={<TenantGate><AdminRoute requiredRole="admin"><AdminConteudo /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/settings" element={<TenantGate><AdminRoute requiredRole="admin"><AdminConfiguracoes /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/customize" element={<TenantGate><AdminRoute requiredRole="admin"><AdminPersonalizacao /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/plans" element={<TenantGate><AdminRoute requiredRole="admin"><AdminPlanos /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/support" element={<TenantGate><AdminRoute requiredRole="admin"><AdminSuporte /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/social-links" element={<TenantGate><AdminRoute requiredRole="admin"><AdminSocialLinks /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/domain" element={<TenantGate><AdminRoute requiredRole="admin"><AdminDominio /></AdminRoute></TenantGate>} />

                {/* ⚡ Rotas SUPER ADMIN (Minha Visão Global) */}
                <Route path="/admin-master/login" element={<SuperAdminLogin />} />
                <Route path="/admin-master" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
                <Route path="/admin-master/tenants" element={<SuperAdminRoute><SuperAdminTenants /></SuperAdminRoute>} />
                <Route path="/admin-master/ranking" element={<SuperAdminRoute><SuperAdminRanking /></SuperAdminRoute>} />
                <Route path="/admin-master/plans" element={<SuperAdminRoute><SuperAdminPlanos /></SuperAdminRoute>} />
                <Route path="/admin-master/settings" element={<SuperAdminRoute><SuperAdminConfiguracoes /></SuperAdminRoute>} />
                <Route path="/admin-master/support" element={<SuperAdminRoute><SuperAdminSuporte /></SuperAdminRoute>} />

                <Route path="*" element={<CustomDomainResolver fallback={<NotFound />}><NotFound /></CustomDomainResolver>} />
              </Routes>
            </TooltipProvider>
          </WhiteLabelProvider>
        </TenantProvider>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
