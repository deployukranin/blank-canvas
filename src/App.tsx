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

import Index from "./pages/Index";
import Ideias from "./pages/Ideias";

import Assinaturas from "./pages/Assinaturas";
import ProdutoAssinatura from "./pages/ProdutoAssinatura";
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
import Auth from "./pages/Auth";
import ClientAuth from "./pages/ClientAuth";

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
import AdminYoutube from "./pages/admin/AdminYoutube";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminConteudo from "./pages/admin/AdminConteudo";
import AdminConfiguracoes from "./pages/admin/AdminConfiguracoes";
import AdminPersonalizacao from "./pages/admin/AdminPersonalizacao";
import AdminPlanos from "./pages/admin/AdminPlanos";
import AdminSuporte from "./pages/admin/AdminSuporte";

// Super Admin Pages
import SuperAdminLogin from "./pages/super-admin/SuperAdminLogin";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import SuperAdminTenants from "./pages/super-admin/SuperAdminTenants";
import SuperAdminRanking from "./pages/super-admin/SuperAdminRanking";
import SuperAdminConfiguracoes from "./pages/super-admin/SuperAdminConfiguracoes";
import SuperAdminSuporte from "./pages/super-admin/SuperAdminSuporte";

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
                {/* Rotas Públicas (sem tenant) */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/entrar" element={<ClientAuth />} />
                
                <Route path="/assinaturas" element={<Assinaturas />} />
                <Route path="/assinaturas/:id" element={<ProdutoAssinatura />} />
                <Route path="/ajuda" element={<Ajuda />} />
                <Route path="/termos" element={<TermosDeUso />} />
                <Route path="/privacidade" element={<Privacidade />} />
                
                {/* Rotas Protegidas (Usuário Logado, sem tenant) */}
                <Route path="/ideias" element={<ProtectedRoute><Ideias /></ProtectedRoute>} />
                <Route path="/vip" element={<ProtectedRoute><VIP /></ProtectedRoute>} />
                <Route path="/customs" element={<ProtectedRoute><Customs /></ProtectedRoute>} />
                <Route path="/comunidade" element={<ProtectedRoute><Comunidade /></ProtectedRoute>} />
                <Route path="/galeria" element={<ProtectedRoute><GaleriaVideos /></ProtectedRoute>} />
                <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                <Route path="/meus-pedidos" element={<ProtectedRoute><MeusPedidos /></ProtectedRoute>} />
                <Route path="/notificacoes" element={<ProtectedRoute><Notificacoes /></ProtectedRoute>} />

                {/* 🏪 Rotas TENANT (Loja do Criador via slug) */}
                <Route path="/:slug" element={<TenantGate><Index /></TenantGate>} />
                <Route path="/:slug/entrar" element={<TenantGate><ClientAuth /></TenantGate>} />
                <Route path="/:slug/customs" element={<TenantGate><ProtectedRoute><Customs /></ProtectedRoute></TenantGate>} />
                <Route path="/:slug/comunidade" element={<TenantGate><ProtectedRoute><Comunidade /></ProtectedRoute></TenantGate>} />
                <Route path="/:slug/ideias" element={<TenantGate><ProtectedRoute><Ideias /></ProtectedRoute></TenantGate>} />
                <Route path="/:slug/vip" element={<TenantGate><ProtectedRoute><VIP /></ProtectedRoute></TenantGate>} />
                <Route path="/:slug/galeria" element={<TenantGate><ProtectedRoute><GaleriaVideos /></ProtectedRoute></TenantGate>} />
                <Route path="/:slug/perfil" element={<TenantGate><ProtectedRoute><Perfil /></ProtectedRoute></TenantGate>} />
                <Route path="/:slug/meus-pedidos" element={<TenantGate><ProtectedRoute><MeusPedidos /></ProtectedRoute></TenantGate>} />
                <Route path="/:slug/notificacoes" element={<TenantGate><ProtectedRoute><Notificacoes /></ProtectedRoute></TenantGate>} />

                {/* 🛡️ Rotas ADMIN (Creator Panel) — scoped by store slug */}
                <Route path="/:slug/admin" element={<TenantGate><AdminRoute requiredRole="admin"><AdminDashboard /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/ideias" element={<TenantGate><AdminRoute requiredRole="admin"><AdminIdeias /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/pedidos" element={<TenantGate><AdminRoute requiredRole="admin"><AdminPedidos /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/pagamentos-pix" element={<TenantGate><AdminRoute requiredRole="admin"><AdminPagamentosPix /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/vip-precos" element={<TenantGate><AdminRoute requiredRole="admin"><AdminVipPrecos /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/vip-conteudo" element={<TenantGate><AdminRoute requiredRole="admin"><AdminVipConteudo /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/videos" element={<TenantGate><AdminRoute requiredRole="admin"><AdminVideos /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/audios" element={<TenantGate><AdminRoute requiredRole="admin"><AdminAudios /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/youtube" element={<TenantGate><AdminRoute requiredRole="admin"><AdminYoutube /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/usuarios" element={<TenantGate><AdminRoute requiredRole="admin"><AdminUsuarios /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/conteudo" element={<TenantGate><AdminRoute requiredRole="admin"><AdminConteudo /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/configuracoes" element={<TenantGate><AdminRoute requiredRole="admin"><AdminConfiguracoes /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/personalizacao" element={<TenantGate><AdminRoute requiredRole="admin"><AdminPersonalizacao /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/planos" element={<TenantGate><AdminRoute requiredRole="admin"><AdminPlanos /></AdminRoute></TenantGate>} />
                <Route path="/:slug/admin/suporte" element={<TenantGate><AdminRoute requiredRole="admin"><AdminSuporte /></AdminRoute></TenantGate>} />

                {/* ⚡ Rotas SUPER ADMIN (Minha Visão Global) */}
                <Route path="/admin-master/login" element={<SuperAdminLogin />} />
                <Route path="/admin-master" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
                <Route path="/admin-master/tenants" element={<SuperAdminRoute><SuperAdminTenants /></SuperAdminRoute>} />
                <Route path="/admin-master/ranking" element={<SuperAdminRoute><SuperAdminRanking /></SuperAdminRoute>} />
                <Route path="/admin-master/configuracoes" element={<SuperAdminRoute><SuperAdminConfiguracoes /></SuperAdminRoute>} />
                <Route path="/admin-master/suporte" element={<SuperAdminRoute><SuperAdminSuporte /></SuperAdminRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </WhiteLabelProvider>
        </TenantProvider>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
