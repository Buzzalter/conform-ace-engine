import { Home, Shield, BookOpen, ShieldAlert, Gavel, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard / Home", url: "/", icon: Home },
  { title: "Conformance Engine", url: "/conformance", icon: Shield },
  { title: "Research Assistant", url: "/research", icon: BookOpen },
  { title: "OSINT Redaction", url: "/redaction", icon: ShieldAlert },
  { title: "Bid Analyser", url: "/bid-analyser", icon: Gavel },
  { title: "Insights Hub", url: "/insights", icon: Sparkles },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        {!collapsed && (
          <div className="px-4 py-5 border-b border-sidebar-border">
            <h2 className="text-base font-bold text-sidebar-primary-foreground tracking-tight">OmniDoc Engine</h2>
            <p className="text-[11px] text-sidebar-foreground mt-0.5">Unified AI Framework</p>
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      className={`${active ? "bg-sidebar-accent text-sidebar-primary font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {!collapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
