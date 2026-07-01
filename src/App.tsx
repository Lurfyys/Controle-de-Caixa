/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Gem,
  DollarSign,
  Calendar,
  Menu,
  X,
  LogOut,
  Bookmark,
  FileText,
  Settings as SettingsIcon,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

import { BlackstoneDB, UserData } from "./lib/store";
import { User } from "./types";
import { api } from "./services/api";

import { Auth } from "./components/Auth";
import { Logo } from "./components/Logo";
import { Dashboard } from "./components/Dashboard";
import { Inventory } from "./components/Inventory";
import { Finance } from "./components/Finance";
import { AgendaView } from "./components/AgendaView";
import { KanbanBoard } from "./components/KanbanBoard";
import { NotesView } from "./components/NotesView";
import { ReportsView } from "./components/ReportsView";
import { SettingsView } from "./components/SettingsView";

type TabType =
  | "dashboard"
  | "inventory"
  | "finance"
  | "agenda"
  | "kanban"
  | "notes"
  | "reports"
  | "settings";

export default function App() {
  const [session, setSession] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"luxo" | "claro" | "rubi">("luxo");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem("blackstone_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.me();

        const restoredUser: User = response.user || response;

        setSession(restoredUser);

        let data = BlackstoneDB.getUserData(restoredUser.id);

        if (!data) {
          data = BlackstoneDB.initializeUserData(restoredUser);
        }

        setUserData(data);

        if (data?.settings?.theme) {
          setTheme(data.settings.theme as any);
        }
      } catch (error) {
        console.error("Erro ao restaurar sessão:", error);
        localStorage.removeItem("blackstone_token");
        BlackstoneDB.logout();
        setSession(null);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  const handleSaveUserData = (updated: UserData) => {
    if (!session) return;

    setUserData(updated);
    BlackstoneDB.saveUserData(session.id, updated);
  };

  const handleThemeChange = (newTheme: "luxo" | "claro" | "rubi") => {
    setTheme(newTheme);

    if (userData) {
      handleSaveUserData({
        ...userData,
        settings: {
          ...userData.settings,
          theme: newTheme,
        },
      });
    }
  };

  const handleLogout = () => {
    api.logout();
    BlackstoneDB.logout();
    setSession(null);
    setUserData(null);
    setActiveTab("dashboard");
  };

  const handleAuthSuccess = (newSession: User) => {
    setSession(newSession);

    let data = BlackstoneDB.getUserData(newSession.id);

    if (!data) {
      data = BlackstoneDB.initializeUserData(newSession);
    }

    setUserData(data);

    if (data?.settings?.theme) {
      setTheme(data.settings.theme as any);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-amber-400 flex items-center justify-center font-mono text-xs tracking-[0.3em] uppercase">
        Carregando BlackStone...
      </div>
    );
  }

  if (!session || !userData) {
    return <Auth onAuthSuccess={handleAuthSuccess} theme={theme} />;
  }

  const themeBg =
    theme === "luxo"
      ? "bg-black text-neutral-100 selection:bg-amber-500/30"
      : theme === "claro"
      ? "bg-[#fdfcf9] text-stone-900 selection:bg-stone-900/10"
      : "bg-[#060203] text-stone-100 selection:bg-rose-900/30";

  const sidebarBg =
    theme === "luxo"
      ? "bg-neutral-950 border-r border-neutral-900 text-neutral-300"
      : theme === "claro"
      ? "bg-white border-r border-stone-200/80 text-stone-700"
      : "bg-[#090305] border-r border-[#2a0a12] text-stone-200";

  const topbarBg =
    theme === "luxo"
      ? "bg-neutral-950/60 border-b border-neutral-900 backdrop-blur-md"
      : theme === "claro"
      ? "bg-white/90 border-b border-stone-200/80 backdrop-blur-md"
      : "bg-[#090305]/70 border-b border-[#2a0a12] backdrop-blur-md";

  const textAccent =
    theme === "luxo"
      ? "text-amber-400"
      : theme === "claro"
      ? "text-stone-800 font-bold"
      : "text-rose-400";

  const menuItems: {
    id: TabType;
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inventory", label: "Inventário / Cofre", icon: Gem },
    { id: "finance", label: "Caixa / DRE", icon: DollarSign },
    { id: "agenda", label: "Agenda Integrada", icon: Calendar },
    { id: "kanban", label: "Quadro Kanban", icon: CheckCircle2 },
    { id: "notes", label: "Ideias & Croquis", icon: Bookmark },
    { id: "reports", label: "Relatórios PDF", icon: FileText },
    { id: "settings", label: "Preferências", icon: SettingsIcon },
  ];

  const getInactiveNavClass = () => {
    if (theme === "claro") {
      return "hover:bg-stone-100 text-stone-500 hover:text-stone-900";
    }

    if (theme === "rubi") {
      return "text-stone-300 hover:text-rose-100 hover:bg-rose-500/10";
    }

    return "hover:bg-neutral-800/10 text-neutral-400 hover:text-neutral-200";
  };

  const getInactiveIconClass = () => {
    if (theme === "rubi") return "text-stone-400";
    return "text-neutral-500";
  };

  return (
    <div
      className={`min-h-screen flex font-sans ${themeBg}`}
      id="blackstone-app-frame"
    >
      <div
        className={`lg:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3 flex justify-between items-center ${topbarBg}`}
      >
        <div className="flex items-center gap-2">
          <Logo size={24} showText={false} theme={theme} />

          <span
            className={`text-xs font-serif tracking-widest uppercase truncate max-w-[200px] ${
              theme === "claro" ? "text-stone-900" : "text-neutral-100"
            }`}
          >
            {userData.settings.companyName || "BLACKSTONE"}
          </span>
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`p-1.5 rounded cursor-pointer ${
            theme === "claro"
              ? "bg-stone-100 text-stone-600 border border-stone-200/50"
              : "bg-neutral-900 text-neutral-300"
          }`}
          id="btn-mobile-menu"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <aside
        className={`
          fixed lg:static top-0 bottom-0 left-0 z-50 w-72 flex flex-col justify-between p-6 transition-all duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${sidebarBg}
        `}
        id="app-sidebar"
      >
        <div className="space-y-8">
          <div className="flex items-center gap-3.5 pb-2">
            <Logo size={36} showText={false} theme={theme} />

            <div>
              <h2
                className={`text-sm font-serif font-light tracking-widest uppercase truncate max-w-[180px] ${
                  theme === "claro" ? "text-stone-900" : "text-neutral-100"
                }`}
              >
                {userData.settings.companyName || "BLACKSTONE"}
              </h2>
            </div>
          </div>

          <nav className="space-y-1" id="nav-container">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    group w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 cursor-pointer
                    ${
                      isActive
                        ? theme === "luxo"
                          ? "bg-amber-500/10 text-amber-400 border-l-2 border-amber-500"
                          : theme === "claro"
                          ? "bg-stone-100 text-stone-900 border-l-2 border-stone-950 font-semibold"
                          : "bg-rose-500/15 text-rose-300 border-l-2 border-rose-500"
                        : getInactiveNavClass()
                    }
                  `}
                  id={`nav-link-${item.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={14}
                      className={isActive ? textAccent : getInactiveIconClass()}
                    />
                    <span>{item.label}</span>
                  </div>

                  <ChevronRight
                    size={10}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                      isActive ? "opacity-100" : ""
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </div>

        <div
          className={`pt-6 border-t ${
            theme === "claro" ? "border-stone-200" : "border-neutral-800/40"
          }`}
        >
          <button
            onClick={handleLogout}
            className={`w-full py-2 rounded-lg text-[10px] uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              theme === "claro"
                ? "bg-stone-50 border border-stone-200 text-stone-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                : theme === "rubi"
                ? "bg-[#0c0406] hover:bg-rose-500/10 border border-[#2a0a12] hover:border-rose-500/30 text-stone-300 hover:text-rose-300"
                : "bg-neutral-950/80 hover:bg-red-500/10 border border-neutral-800 hover:border-red-500/20 text-neutral-400 hover:text-red-400"
            }`}
            id="btn-logout"
          >
            <LogOut size={11} />
            Encerrar Sessão
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0" id="main-content-canvas">
        <header
          className={`hidden lg:flex justify-between items-center px-8 py-4 ${topbarBg}`}
          id="topbar-desktop"
        >
          <div />

          <div className="flex items-center gap-4 text-xs font-mono">
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[10px] ${
                theme === "claro"
                  ? "bg-white border border-stone-200"
                  : theme === "rubi"
                  ? "bg-[#0c0406] border border-[#2a0a12]"
                  : "bg-neutral-950/40 border border-neutral-800"
              }`}
            >
              <span className="text-neutral-500">Meta Pró-labore:</span>

              <span
                className={`font-bold ${
                  theme === "claro"
                    ? "text-stone-800"
                    : theme === "luxo"
                    ? "text-amber-400"
                    : "text-rose-400"
                }`}
              >
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: userData.settings.currency || "BRL",
                }).format(userData.settings.proLaboreGoal || 15000)}
              </span>
            </div>

            <div
              className={`px-3 py-1 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                theme === "luxo"
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  : theme === "claro"
                  ? "bg-stone-100 border-stone-200 text-stone-800"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
            >
              {theme === "luxo"
                ? "Luxo Theme"
                : theme === "claro"
                ? "Claro Theme"
                : "Rubi Theme"}
            </div>
          </div>
        </header>

        <main
          className="flex-1 p-6 lg:p-8 overflow-y-auto mt-14 lg:mt-0"
          id="routed-view-wrapper"
        >
          {activeTab === "dashboard" && (
            <Dashboard
              data={userData}
              onNavigate={(tab) => {
                const allowedTabs = menuItems.map((item) => item.id);

                if (allowedTabs.includes(tab as TabType)) {
                  setActiveTab(tab as TabType);
                }
              }}
              onUpdateWidgets={(updatedWidgets) => {
                handleSaveUserData({
                  ...userData,
                  settings: {
                    ...userData.settings,
                    dashboardWidgets: updatedWidgets,
                  },
                });
              }}
              theme={theme}
            />
          )}

          {activeTab === "inventory" && (
            <Inventory
              data={userData}
              onSaveData={handleSaveUserData}
              theme={theme}
            />
          )}

          {activeTab === "finance" && (
            <Finance
              data={userData}
              onSaveData={handleSaveUserData}
              theme={theme}
            />
          )}

          {activeTab === "agenda" && (
            <AgendaView
              data={userData}
              onSaveData={handleSaveUserData}
              theme={theme}
            />
          )}

          {activeTab === "kanban" && (
            <KanbanBoard
              data={userData}
              onSaveData={handleSaveUserData}
              theme={theme}
            />
          )}

          {activeTab === "notes" && (
            <NotesView
              data={userData}
              onSaveData={handleSaveUserData}
              theme={theme}
            />
          )}

          {activeTab === "reports" && (
            <ReportsView data={userData} theme={theme} />
          )}

          {activeTab === "settings" && (
            <SettingsView
              data={userData}
              onSaveData={handleSaveUserData}
              theme={theme}
              onChangeTheme={handleThemeChange}
            />
          )}
        </main>
      </div>
    </div>
  );
}