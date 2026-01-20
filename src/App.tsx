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
import PerfilConfiguracoes from "./pages/PerfilConfiguracoes";
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
import AdminVideosConfig from "./pages/admin/AdminVideosConfig";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminConteudo from "./pages/admin/AdminConteudo";
import AdminConfiguracoes from "./pages/admin/AdminConfiguracoes";
import Notificacoes from "./pages/Notificacoes";

// CEO Pages
import CEODashboard from "./pages/ceo/CEODashboard";
import CEOBranding from "./pages/ceo/CEOBranding";
import CEOCores from "./pages/ceo/CEOCores";
import CEOIcones from "./pages/ceo/CEOIcones";
import CEOExplorar from "./pages/ceo/CEOExplorar";
import CEOComunidade from "./pages/ceo/CEOComunidade";
import CEOIntegracoes from "./pages/ceo/CEOIntegracoes";
import CEOLoja from "./pages/ceo/CEOLoja";
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
              <Route path="/vip" element={<VIP />} />
              <Route path="/customs" element={<Customs />} />
              <Route path="/comunidade" element={<Comunidade />} />
              <Route path="/galeria-videos" element={<Navigate to="/comunidade" replace />} />
              <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
              <Route path="/perfil/configuracoes" element={<ProtectedRoute><PerfilConfiguracoes /></ProtectedRoute>} />
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
              <Route path="/admin/videos-config" element={<AdminVideosConfig />} />
              <Route path="/admin/usuarios" element={<AdminUsuarios />} />
              <Route path="/admin/conteudo" element={<AdminConteudo />} />
              <Route path="/admin/configuracoes" element={<AdminConfiguracoes />} />

              {/* CEO Routes */}
              <Route path="/ceo" element={<CEODashboard />} />
              <Route path="/ceo/branding" element={<CEOBranding />} />
              <Route path="/ceo/cores" element={<CEOCores />} />
              <Route path="/ceo/icones" element={<CEOIcones />} />
              <Route path="/ceo/explorar" element={<CEOExplorar />} />
              <Route path="/ceo/comunidade" element={<CEOComunidade />} />
              <Route path="/ceo/integracoes" element={<CEOIntegracoes />} />
              <Route path="/ceo/loja" element={<CEOLoja />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WhiteLabelProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
