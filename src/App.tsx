import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Integrations from "./pages/Integrations";
import Repositories from "./pages/Repositories";
import TemplateParts from "./pages/TemplateParts";
import Templates from "./pages/Templates";
import TemplateComposer from "./pages/TemplateComposer";
import Access from "./pages/Access";
import Onboardings from "./pages/Onboardings";
import OnboardingDetail from "./pages/OnboardingDetail";
import Analytics from "./pages/Analytics";
import Events from "./pages/Events";
import Settings from "./pages/Settings";
import QuestionnairePreview from "./pages/QuestionnairePreview";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/repositories" element={<Repositories />} />
          <Route path="/template-parts" element={<TemplateParts />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/new" element={<TemplateComposer />} />
          <Route path="/templates/:id/edit" element={<TemplateComposer />} />
          <Route path="/access" element={<Access />} />
          <Route path="/onboardings" element={<Onboardings />} />
          <Route path="/onboardings/:id" element={<OnboardingDetail />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/events" element={<Events />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/questionnaires/preview" element={<QuestionnairePreview />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
