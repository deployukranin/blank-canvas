import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WhiteLabelProvider } from "@/contexts/WhiteLabelContext";
import { SubdomainProvider, useSubdomain } from "@/contexts/SubdomainContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import StoreRoutes from "@/components/routing/StoreRoutes";
import StoreLayout from "@/components/layout/StoreLayout";

import LandingPage from "./pages/LandingPage";
import HomeRedirect from "./pages/HomeRedirect";
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
import AdminRouteLayout from "./pages/admin/AdminRouteLayout";
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
import AdminLojaPersonalizacao from "./pages/admin/AdminLojaPersonalizacao";
import CEOIntegracoes from "./pages/ceo/CEOIntegracoes";

// CEO Pages
import CEORouteLayout from "./pages/ceo/CEORouteLayout";
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

/** Decides between platform routes (main domain) or store routes (subdomain) */
const AppRouter = () => {
  const { isMainDomain, isLoading } = useSubdomain();

  // If subdomain detected, render store-only routes
  if (!isMainDomain) {
    return <StoreRoutes />;
  }

  // Main domain — full platform routes
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/auth" element={<Auth />} />

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

      {/* 🛡️ Rotas ADMIN — auth centralizada no AdminRouteLayout */}
      <Route path="/admin" element={<AdminRouteLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="ideias" element={<AdminIdeias />} />
        <Route path="pedidos" element={<AdminPedidos />} />
        <Route path="videos" element={<AdminVideos />} />
        <Route path="precos" element={<AdminPrecos />} />
        <Route path="youtube" element={<AdminYoutube />} />
        <Route path="usuarios" element={<AdminUsuarios />} />
        <Route path="conteudo" element={<AdminConteudo />} />
        <Route path="configuracoes" element={<AdminConfiguracoes />} />
        <Route path="pix" element={<AdminPixConfig />} />
        <Route path="loja-visual" element={<AdminLojaPersonalizacao />} />
      </Route>

      {/* 🛡️ Rotas CEO — auth centralizada no CEORouteLayout */}
      <Route path="/ceo" element={<CEORouteLayout />}>
        <Route index element={<CEODashboard />} />
        <Route path="lojas" element={<CEOLojas />} />
        <Route path="vendas" element={<CEOVendas />} />
        <Route path="usuarios" element={<CEOUsuarios />} />
        <Route path="trafego" element={<CEOTrafego />} />
        <Route path="metricas" element={<CEOMetricas />} />
        <Route path="alertas" element={<CEOAlertas />} />
        <Route path="configuracoes" element={<CEOConfiguracoes />} />
        <Route path="landing-page" element={<CEOLandingPage />} />
        <Route path="integracoes" element={<CEOIntegracoes />} />
      </Route>

      {/* 🏪 Rotas dinâmicas de loja (catch-all por slug) */}
      <Route path="/:slug" element={<StoreLayout />}>
        <Route index element={<StoreHome />} />
        <Route path="auth" element={<StoreAuth />} />
        <Route path="customs" element={<ProtectedRoute><Customs /></ProtectedRoute>} />
        <Route path="comunidade" element={<ProtectedRoute><Comunidade /></ProtectedRoute>} />
        <Route path="perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        <Route path="galeria" element={<ProtectedRoute><GaleriaVideos /></ProtectedRoute>} />
        <Route path="ideias" element={<ProtectedRoute><Ideias /></ProtectedRoute>} />
        <Route path="notificacoes" element={<ProtectedRoute><Notificacoes /></ProtectedRoute>} />
        <Route path="meus-pedidos" element={<ProtectedRoute><MeusPedidos /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WhiteLabelProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SubdomainProvider>
              <AppRouter />
            </SubdomainProvider>
          </BrowserRouter>
        </TooltipProvider>
      </WhiteLabelProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
