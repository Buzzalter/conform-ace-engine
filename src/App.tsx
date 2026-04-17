import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import DashboardPage from "@/pages/DashboardPage";
import ConformanceEngine from "@/pages/ConformanceEngine";
import ResearchAssistant from "@/pages/ResearchAssistant";
import RedactionEngine from "@/pages/RedactionEngine";
import BidAnalyser from "@/pages/BidAnalyser";

const queryClient = new QueryClient();

function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center justify-between border-b border-border shrink-0 px-3">
            <SidebarTrigger />
            <LanguageSelector />
          </header>
          <main className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/conformance" element={<ConformanceEngine />} />
              <Route path="/research" element={<ResearchAssistant />} />
              <Route path="/redaction" element={<RedactionEngine />} />
              <Route path="/bid-analyser" element={<BidAnalyser />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Toaster />
          <AppLayout />
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
