import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WhiteLabelProvider } from "@/contexts/WhiteLabelContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Ideias from "./pages/Ideias";
import Loja from "./pages/Loja";
import Assinaturas from "./pages/Assinaturas";
import ProdutoAssinatura from "./pages/ProdutoAssinatura";
import VIP from "./pages/VIP";
import Customs from "./pages/Customs";
import Comunidade from "./pages/Comunidade";
import GaleriaVideos from "./pages/GaleriaVideos";
import Perfil from "./pages/Perfil";

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
import Notificacoes from "./pages/Notificacoes";

// CEO Pages
import CEODashboard from "./pages/ceo/CEODashboard";
import CEOPersonalizacao from "./pages/ceo/CEOPersonalizacao";
import CEOIntegracoes from "./pages/ceo/CEOIntegracoes";
import Setup from "./pages/Setup";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WhiteLabelProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/setup" element={<Setup />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/ideias" element={<Ideias />} />
              <Route path="/loja" element={<Loja />} />
              <Route path="/assinaturas" element={<Assinaturas />} />
              <Route path="/loja/produto/:id" element={<ProdutoAssinatura />} />
              <Route path="/vip" element={<Navigate to="/comunidade?tab=vip" replace />} />
              <Route path="/customs" element={<Customs />} />
              <Route path="/comunidade" element={<Comunidade />} />
              <Route path="/galeria-videos" element={<Navigate to="/comunidade" replace />} />
              <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
              
              <Route path="/ajuda" element={<Ajuda />} />
              <Route path="/termos" element={<TermosDeUso />} />
              <Route path="/privacidade" element={<Privacidade />} />
              <Route path="/meus-pedidos" element={<ProtectedRoute><MeusPedidos /></ProtectedRoute>} />
              <Route path="/notificacoes" element={<ProtectedRoute><Notificacoes /></ProtectedRoute>} />
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/ideias" element={<AdminIdeias />} />
              <Route path="/admin/pedidos" element={<AdminPedidos />} />
              <Route path="/admin/pagamentos-pix" element={<AdminPagamentosPix />} />
              <Route path="/admin/vip-precos" element={<AdminVipPrecos />} />
              <Route path="/admin/videos" element={<AdminVideos />} />
              <Route path="/admin/audios" element={<AdminAudios />} />
              <Route path="/admin/youtube" element={<AdminYoutube />} />
              <Route path="/admin/usuarios" element={<AdminUsuarios />} />
              <Route path="/admin/conteudo" element={<AdminConteudo />} />
              <Route path="/admin/configuracoes" element={<AdminConfiguracoes />} />

              {/* CEO Routes */}
              <Route path="/ceo" element={<CEODashboard />} />
              <Route path="/ceo/personalizacao" element={<CEOPersonalizacao />} />
              <Route path="/ceo/integracoes" element={<CEOIntegracoes />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WhiteLabelProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
