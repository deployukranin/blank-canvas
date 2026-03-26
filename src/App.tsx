import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WhiteLabelProvider } from "@/contexts/WhiteLabelContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { SuperAdminRoute } from "@/components/auth/SuperAdminRoute";

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

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminIdeias from "./pages/admin/AdminIdeias";
import AdminPedidos from "./pages/admin/AdminPedidos";
import AdminPagamentosPix from "./pages/admin/AdminPagamentosPix";
import AdminVipPrecos from "./pages/admin/AdminVipPrecos";
import AdminVideos from "./pages/admin/AdminVideos";
import AdminAudios from "./pages/admin/AdminAudios";
import AdminYoutube from "./pages/admin/AdminYoutube";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminConteudo from "./pages/admin/AdminConteudo";
import AdminConfiguracoes from "./pages/admin/AdminConfiguracoes";
import AdminPersonalizacao from "./pages/admin/AdminPersonalizacao";
import AdminBanners from "./pages/admin/AdminBanners";

// Super Admin Pages
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import SuperAdminTenants from "./pages/super-admin/SuperAdminTenants";
import SuperAdminRanking from "./pages/super-admin/SuperAdminRanking";
import SuperAdminConfiguracoes from "./pages/super-admin/SuperAdminConfiguracoes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WhiteLabelProvider>
        <TenantProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Rotas Públicas */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                
                <Route path="/assinaturas" element={<Assinaturas />} />
                <Route path="/assinaturas/:id" element={<ProdutoAssinatura />} />
                <Route path="/ajuda" element={<Ajuda />} />
                <Route path="/termos" element={<TermosDeUso />} />
                <Route path="/privacidade" element={<Privacidade />} />
                
                {/* Rotas Protegidas (Usuário Logado) */}
                <Route path="/ideias" element={<ProtectedRoute><Ideias /></ProtectedRoute>} />
                <Route path="/vip" element={<ProtectedRoute><VIP /></ProtectedRoute>} />
                <Route path="/customs" element={<ProtectedRoute><Customs /></ProtectedRoute>} />
                <Route path="/comunidade" element={<ProtectedRoute><Comunidade /></ProtectedRoute>} />
                <Route path="/galeria" element={<ProtectedRoute><GaleriaVideos /></ProtectedRoute>} />
                <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                <Route path="/meus-pedidos" element={<ProtectedRoute><MeusPedidos /></ProtectedRoute>} />
                <Route path="/notificacoes" element={<ProtectedRoute><Notificacoes /></ProtectedRoute>} />

                {/* 🛡️ Rotas ADMIN (Creator Panel) */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminRoute requiredRole="admin"><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/ideias" element={<AdminRoute requiredRole="admin"><AdminIdeias /></AdminRoute>} />
                <Route path="/admin/pedidos" element={<AdminRoute requiredRole="admin"><AdminPedidos /></AdminRoute>} />
                <Route path="/admin/pagamentos-pix" element={<AdminRoute requiredRole="admin"><AdminPagamentosPix /></AdminRoute>} />
                <Route path="/admin/vip-precos" element={<AdminRoute requiredRole="admin"><AdminVipPrecos /></AdminRoute>} />
                <Route path="/admin/videos" element={<AdminRoute requiredRole="admin"><AdminVideos /></AdminRoute>} />
                <Route path="/admin/audios" element={<AdminRoute requiredRole="admin"><AdminAudios /></AdminRoute>} />
                <Route path="/admin/youtube" element={<AdminRoute requiredRole="admin"><AdminYoutube /></AdminRoute>} />
                <Route path="/admin/usuarios" element={<AdminRoute requiredRole="admin"><AdminUsuarios /></AdminRoute>} />
                <Route path="/admin/conteudo" element={<AdminRoute requiredRole="admin"><AdminConteudo /></AdminRoute>} />
                <Route path="/admin/configuracoes" element={<AdminRoute requiredRole="admin"><AdminConfiguracoes /></AdminRoute>} />
                <Route path="/admin/personalizacao" element={<AdminRoute requiredRole="admin"><AdminPersonalizacao /></AdminRoute>} />
                <Route path="/admin/banners" element={<AdminRoute requiredRole="admin"><AdminBanners /></AdminRoute>} />

                {/* ⚡ Rotas SUPER ADMIN (Minha Visão Global) */}
                <Route path="/admin-master" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
                <Route path="/admin-master/tenants" element={<SuperAdminRoute><SuperAdminTenants /></SuperAdminRoute>} />
                <Route path="/admin-master/ranking" element={<SuperAdminRoute><SuperAdminRanking /></SuperAdminRoute>} />
                <Route path="/admin-master/configuracoes" element={<SuperAdminRoute><SuperAdminConfiguracoes /></SuperAdminRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </TenantProvider>
      </WhiteLabelProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
