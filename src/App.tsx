import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WhiteLabelProvider } from "@/contexts/WhiteLabelContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute"; // <--- NOVO IMPORT


import LandingPage from "./pages/LandingPage";
import Ideias from "./pages/Ideias";

import Assinaturas from "./pages/Assinaturas";
import ProdutoAssinatura from "./pages/ProdutoAssinatura";
import Customs from "./pages/Customs";
import Comunidade from "./pages/Comunidade";
import GaleriaVideos from "./pages/GaleriaVideos";
import StoreHome from "./pages/StoreHome";
import Perfil from "./pages/Perfil";
import Notificacoes from "./pages/Notificacoes";

import Ajuda from "./pages/Ajuda";
import TermosDeUso from "./pages/TermosDeUso";
import Privacidade from "./pages/Privacidade";
import MeusPedidos from "./pages/MeusPedidos";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import StoreAuth from "./pages/StoreAuth";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminIdeias from "./pages/admin/AdminIdeias";
import AdminPedidos from "./pages/admin/AdminPedidos";


import AdminVideos from "./pages/admin/AdminVideos";
import AdminPrecos from "./pages/admin/AdminPrecos";
import AdminYoutube from "./pages/admin/AdminYoutube";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminConteudo from "./pages/admin/AdminConteudo";
import AdminConfiguracoes from "./pages/admin/AdminConfiguracoes";
import AdminPixConfig from "./pages/admin/AdminPixConfig";
import AdminPersonalizacao from "./pages/admin/AdminPersonalizacao";
import AdminLojaPersonalizacao from "./pages/admin/AdminLojaPersonalizacao";
import CEOIntegracoes from "./pages/ceo/CEOIntegracoes";

// CEO Pages
import CEODashboard from "./pages/ceo/CEODashboard";
import CEOLojas from "./pages/ceo/CEOLojas";
import CEOVendas from "./pages/ceo/CEOVendas";
import CEOUsuarios from "./pages/ceo/CEOUsuarios";
import CEOTrafego from "./pages/ceo/CEOTrafego";
import CEOMetricas from "./pages/ceo/CEOMetricas";
import CEOAlertas from "./pages/ceo/CEOAlertas";
import CEOConfiguracoes from "./pages/ceo/CEOConfiguracoes";
import CEOLandingPage from "./pages/ceo/CEOLandingPage";

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
              {/* Rotas Públicas */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/loja/:slug/auth" element={<StoreAuth />} />
              <Route path="/loja/:slug" element={<StoreHome />} />
              
              <Route path="/assinaturas" element={<Assinaturas />} />
              <Route path="/assinaturas/:id" element={<ProdutoAssinatura />} />
              <Route path="/ajuda" element={<Ajuda />} />
              <Route path="/termos" element={<TermosDeUso />} />
              <Route path="/privacidade" element={<Privacidade />} />
              
              {/* Rotas Protegidas (Usuário Logado) */}
              <Route path="/ideias" element={<ProtectedRoute><Ideias /></ProtectedRoute>} />
              
              <Route path="/customs" element={<ProtectedRoute><Customs /></ProtectedRoute>} />
              <Route path="/comunidade" element={<ProtectedRoute><Comunidade /></ProtectedRoute>} />
              <Route path="/galeria" element={<ProtectedRoute><GaleriaVideos /></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
              <Route path="/meus-pedidos" element={<ProtectedRoute><MeusPedidos /></ProtectedRoute>} />
              <Route path="/notificacoes" element={<ProtectedRoute><Notificacoes /></ProtectedRoute>} />

              {/* 🛡️ Rotas ADMIN (Blindadas) */}
              <Route path="/admin/login" element={<AdminLogin />} />
              
              <Route path="/admin" element={<AdminRoute requiredRole="admin"><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/ideias" element={<AdminRoute requiredRole="admin"><AdminIdeias /></AdminRoute>} />
              <Route path="/admin/pedidos" element={<AdminRoute requiredRole="admin"><AdminPedidos /></AdminRoute>} />
              
              
              <Route path="/admin/videos" element={<AdminRoute requiredRole="admin"><AdminVideos /></AdminRoute>} />
              <Route path="/admin/precos" element={<AdminRoute requiredRole="admin"><AdminPrecos /></AdminRoute>} />
              <Route path="/admin/youtube" element={<AdminRoute requiredRole="admin"><AdminYoutube /></AdminRoute>} />
              <Route path="/admin/usuarios" element={<AdminRoute requiredRole="admin"><AdminUsuarios /></AdminRoute>} />
              <Route path="/admin/conteudo" element={<AdminRoute requiredRole="admin"><AdminConteudo /></AdminRoute>} />
              <Route path="/admin/configuracoes" element={<AdminRoute requiredRole="admin"><AdminConfiguracoes /></AdminRoute>} />
              <Route path="/admin/pix" element={<AdminRoute requiredRole="admin"><AdminPixConfig /></AdminRoute>} />
              
              <Route path="/admin/loja-visual" element={<AdminRoute requiredRole="admin"><AdminLojaPersonalizacao /></AdminRoute>} />
              

              {/* 🛡️ Rotas CEO (Nível Máximo) */}
              <Route path="/ceo" element={<AdminRoute requiredRole="ceo"><CEODashboard /></AdminRoute>} />
              <Route path="/ceo/lojas" element={<AdminRoute requiredRole="ceo"><CEOLojas /></AdminRoute>} />
              <Route path="/ceo/vendas" element={<AdminRoute requiredRole="ceo"><CEOVendas /></AdminRoute>} />
              <Route path="/ceo/usuarios" element={<AdminRoute requiredRole="ceo"><CEOUsuarios /></AdminRoute>} />
              <Route path="/ceo/trafego" element={<AdminRoute requiredRole="ceo"><CEOTrafego /></AdminRoute>} />
              <Route path="/ceo/metricas" element={<AdminRoute requiredRole="ceo"><CEOMetricas /></AdminRoute>} />
              <Route path="/ceo/alertas" element={<AdminRoute requiredRole="ceo"><CEOAlertas /></AdminRoute>} />
              <Route path="/ceo/configuracoes" element={<AdminRoute requiredRole="ceo"><CEOConfiguracoes /></AdminRoute>} />
              <Route path="/ceo/landing-page" element={<AdminRoute requiredRole="ceo"><CEOLandingPage /></AdminRoute>} />
              <Route path="/ceo/integracoes" element={<AdminRoute requiredRole="ceo"><CEOIntegracoes /></AdminRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WhiteLabelProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;