import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import DashboardPage from "@/pages/DashboardPage";
import ConformanceEngine from "@/pages/ConformanceEngine";
import ResearchAssistant from "@/pages/ResearchAssistant";
import RedactionEngine from "@/pages/RedactionEngine";

const queryClient = new QueryClient();

function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border shrink-0">
            <SidebarTrigger className="ml-3" />
          </header>
          <main className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/conformance" element={<ConformanceEngine />} />
              <Route path="/research" element={<ResearchAssistant />} />
              <Route path="/redaction" element={<RedactionEngine />} />
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
      <BrowserRouter>
        <Toaster />
        <AppLayout />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
