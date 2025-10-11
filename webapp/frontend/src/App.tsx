import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Integrations from "./pages/Integrations";
import Repositories from "./pages/Repositories";
import TemplateParts from "./pages/TemplateParts";
import Templates from "./pages/Templates";
import TemplateComposer from "./pages/TemplateComposer";
import Access from "./pages/Access";
import Onboardings from "./pages/Onboardings";
import OnboardingDetail from "./pages/OnboardingDetail";
import Settings from "./pages/Settings";
import QuestionnairePreview from "./pages/QuestionnairePreview";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
            <Route path="/repositories" element={<ProtectedRoute><Repositories /></ProtectedRoute>} />
            <Route path="/template-parts" element={<ProtectedRoute><TemplateParts /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
            <Route path="/templates/new" element={<ProtectedRoute><TemplateComposer /></ProtectedRoute>} />
            <Route path="/templates/:id/edit" element={<ProtectedRoute><TemplateComposer /></ProtectedRoute>} />
            <Route path="/access" element={<ProtectedRoute><Access /></ProtectedRoute>} />
            <Route path="/onboardings" element={<ProtectedRoute><Onboardings /></ProtectedRoute>} />
            <Route path="/onboardings/:id" element={<ProtectedRoute><OnboardingDetail /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/questionnaires/preview" element={<ProtectedRoute><QuestionnairePreview /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
