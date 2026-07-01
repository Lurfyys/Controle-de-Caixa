/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Gem,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Bookmark,
  ArrowRight,
  Sparkles,
  Loader2,
} from "lucide-react";
import { UserData } from "../lib/store";
import { formatCurrency } from "./SettingsView";
import { PieChart } from "./PieChart";
import { api } from "../services/api";

interface DashboardProps {
  data: UserData;
  onNavigate: (tab: string) => void;
  onUpdateWidgets: (updatedWidgets: { id: string; title: string; visible: boolean }[]) => void;
  theme?: "luxo" | "claro" | "rubi";
}

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  weight: number;
  goldType: string;
  gem: string;
  costPrice: number;
  sellPrice: number;
  quantity?: number;
  status: string;
  description?: string | null;
  imageUrl?: string | null;
};

type CashItem = {
  id: string;
  userId: string;
  type: "entrada" | "saida";
  category: string;
  subcategory?: string | null;
  amount: number;
  description?: string | null;
  date: string;
  createdAt?: string;
};

type CalendarEventItem = {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  date: string;
  time?: string | null;
  location?: string | null;
  priority?: string;
  status?: string;
  color?: string | null;
};

export const Dashboard: React.FC<DashboardProps> = ({
  data,
  onNavigate,
  onUpdateWidgets,
  theme = "luxo",
}) => {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [widgetList, setWidgetList] = useState(data.settings.dashboardWidgets || []);
  const [chartMode, setChartMode] = useState<"consolidado" | "categorias">("consolidado");

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [cash, setCash] = useState<CashItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoadingDashboard(true);

        const [inventoryRes, cashRes, calendarRes] = await Promise.all([
          api.getInventory(),
          api.getCash(),
          api.getCalendarEvents(),
        ]);

        setInventory(inventoryRes.inventory || []);
        setCash(cashRes.cash || []);
        setCalendarEvents(calendarRes.events || []);
      } catch (error) {
        console.error(error);
        alert("Erro ao carregar dados do dashboard.");
      } finally {
        setLoadingDashboard(false);
      }
    }

    loadDashboardData();
  }, []);

  const toggleWidget = (id: string) => {
    const updated = widgetList.map((w) =>
      w.id === id ? { ...w, visible: !w.visible } : w
    );
    setWidgetList(updated);
    onUpdateWidgets(updated);
  };

  const isVisible = (id: string) => {
    const found = widgetList.find((w) => w.id === id);
    return found ? found.visible : true;
  };

  const parseLocalDate = (dateStr: string) => {
    const datePart = dateStr.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
  };

  const formatDateToInput = (dateObj: Date) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const currency = data.settings.currency || "BRL";

  const availableItems = inventory.filter((item) => item.status === "Disponível");
  const inventoryValue = availableItems.reduce(
    (acc, item) => acc + Number(item.sellPrice || 0) * Number(item.quantity || 1),
    0
  );
  const jewelryCount = availableItems.reduce(
    (acc, item) => acc + Number(item.quantity || 1),
    0
  );

  const totalIn = cash
    .filter((t) => t.type === "entrada")
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const totalOut = cash
    .filter((t) => t.type === "saida")
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const currentCashBalance = totalIn - totalOut;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = cash.filter((t) => {
    const d = parseLocalDate(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlyRevenue = monthlyTransactions
    .filter((t) => t.type === "entrada")
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const monthlyExpenses = monthlyTransactions
    .filter((t) => t.type === "saida")
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const monthlyNetProfit = monthlyRevenue - monthlyExpenses;

  const recentExpenses = [...cash]
    .filter((t) => t.type === "saida")
    .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime())
    .slice(0, 4);

  const recentSales = [...cash]
    .filter((t) => t.type === "entrada")
    .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime())
    .slice(0, 4);

  const todayStr = formatDateToInput(new Date());

  const todayEvents = calendarEvents
    .filter((event) => event.date.split("T")[0] === todayStr)
    .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));

  const pinnedNotes = data.notes.filter((n) => n.isPinned);

  const getChartData = () => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const currentMonthIdx = new Date().getMonth();

    const list = [];

    for (let i = 5; i >= 0; i--) {
      const targetMonth = (currentMonthIdx - i + 12) % 12;
      const targetYear = currentMonthIdx - i < 0 ? currentYear - 1 : currentYear;

      const txs = cash.filter((t) => {
        const d = parseLocalDate(t.date);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      });

      const revenue = txs
        .filter((t) => t.type === "entrada")
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);

      const expenses = txs
        .filter((t) => t.type === "saida")
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);

      list.push({
        name: months[targetMonth],
        revenue,
        expenses,
      });
    }

    return list;
  };

  const chartData = getChartData();

  const totalRevenue6M = chartData.reduce((acc, d) => acc + d.revenue, 0);
  const totalExpenses6M = chartData.reduce((acc, d) => acc + d.expenses, 0);

  const expensesByCategory = cash
    .filter((t) => t.type === "saida")
    .reduce((acc: { [key: string]: number }, t) => {
      const cat = t.category || "Outros";
      acc[cat] = (acc[cat] || 0) + Number(t.amount || 0);
      return acc;
    }, {});

  const categoryColors = ["#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f59e0b", "#6b7280"];

  const expensesPieData = Object.keys(expensesByCategory).map((cat, idx) => ({
    name: cat,
    value: expensesByCategory[cat],
    color: categoryColors[idx % categoryColors.length],
  }));

  const consolidatedPieData = [
    {
      name: "Entradas",
      value: totalRevenue6M,
      color: theme === "luxo" ? "#f59e0b" : theme === "claro" ? "#1c1917" : "#9f1239",
    },
    {
      name: "Saídas",
      value: totalExpenses6M,
      color: "#ef4444",
    },
  ];

  const activePieData = (
    chartMode === "consolidado" ? consolidatedPieData : expensesPieData
  ).filter((item) => Number(item.value) > 0);

  const cardBg =
    theme === "luxo"
      ? "bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md"
      : theme === "claro"
      ? "bg-white border border-stone-200 rounded-2xl p-6 shadow-sm"
      : "bg-stone-900/90 border border-stone-800/80 rounded-2xl p-6 shadow-xl";

  const textPrimary = theme === "claro" ? "text-stone-900" : "text-white";
  const textSecondary = theme === "claro" ? "text-stone-500" : "text-neutral-400";
  const textAccent =
    theme === "luxo"
      ? "text-amber-400"
      : theme === "claro"
      ? "text-stone-800 font-semibold"
      : "text-rose-400";

  if (loadingDashboard) {
    return (
      <div className="p-16 border border-dashed border-neutral-800 rounded-2xl text-center text-xs text-neutral-500">
        <Loader2 className="mx-auto animate-spin text-amber-400 mb-3" size={28} />
        Carregando dashboard com dados reais do banco...
      </div>
    );
  }

  return (
    <div className="space-y-8" id="dashboard-module">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className={`text-[10px] uppercase tracking-widest font-semibold ${textAccent}`}>
            Painel Executivo
          </span>
          <h1 className={`text-2xl md:text-3xl font-serif font-light tracking-wide mt-1 ${textPrimary}`}>
            Bem-vindo ao Blackstone Diamond
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Dados reais do estoque, caixa e agenda carregados pelo backend.
          </p>
        </div>

        <button
          onClick={() => setIsCustomizing(!isCustomizing)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs tracking-wider uppercase border transition-all cursor-pointer ${
            theme === "luxo"
              ? "border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:border-amber-500/50"
              : theme === "claro"
              ? "border-stone-200 text-stone-700 hover:bg-stone-50"
              : "border-stone-800 text-stone-300 hover:bg-stone-800 hover:border-rose-900/50"
          }`}
        >
          <SlidersHorizontal size={14} className={theme === "luxo" ? "text-amber-400" : "text-current"} />
          Personalizar Painel
        </button>
      </div>

      {isCustomizing && (
        <div
          className={`p-6 rounded-2xl border ${
            theme === "luxo"
              ? "bg-neutral-950/60 border-amber-500/20"
              : theme === "claro"
              ? "bg-stone-50 border-stone-300"
              : "bg-stone-950 border-rose-900/40"
          } animate-fade-in`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className={theme === "luxo" ? "text-amber-400" : "text-rose-500"} />
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${textPrimary}`}>
              Configurar Layout do Painel
            </h3>
          </div>

          <p className="text-xs text-neutral-400 mb-4">
            Selecione quais cartões deseja visualizar no Dashboard.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {widgetList.map((widget) => (
              <button
                key={widget.id}
                onClick={() => toggleWidget(widget.id)}
                className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  widget.visible
                    ? theme === "luxo"
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                      : theme === "claro"
                      ? "bg-neutral-900 border-neutral-900 text-white"
                      : "bg-rose-900/20 border-rose-900/50 text-rose-300"
                    : theme === "luxo"
                    ? "bg-neutral-900/20 border-neutral-800/80 text-neutral-500"
                    : "bg-stone-100 border-stone-200 text-stone-400"
                }`}
              >
                <span>{widget.title}</span>
                {widget.visible ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isVisible("balance") && (
          <div className={`${cardBg} relative overflow-hidden group hover:border-amber-500/20 transition-all duration-300`}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <DollarSign size={80} className={theme === "luxo" ? "text-amber-400" : "text-stone-900"} />
            </div>

            <div className="flex justify-between items-start">
              <div>
                <p className={`text-[10px] uppercase tracking-widest font-semibold ${textSecondary}`}>
                  Saldo do Caixa Geral
                </p>
                <h3 className={`text-3xl font-light font-serif mt-2 tracking-wide ${textPrimary}`}>
                  {formatCurrency(currentCashBalance, currency)}
                </h3>
              </div>

              <div className={theme === "luxo" ? "p-2.5 rounded-xl bg-amber-500/10" : "p-2.5 rounded-xl bg-stone-100"}>
                <DollarSign size={18} className={theme === "luxo" ? "text-amber-400" : "text-rose-500"} />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] pt-4 border-t border-neutral-800/40">
              <span className="text-neutral-500">Entradas - Saídas</span>
              <button onClick={() => onNavigate("finance")} className={`flex items-center gap-1 hover:underline cursor-pointer ${textAccent}`}>
                Ver Fluxo <ArrowRight size={10} />
              </button>
            </div>
          </div>
        )}

        {isVisible("inventory") && (
          <div className={`${cardBg} relative overflow-hidden group hover:border-amber-500/20 transition-all duration-300`}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Gem size={80} className={theme === "luxo" ? "text-amber-400" : "text-stone-900"} />
            </div>

            <div className="flex justify-between items-start">
              <div>
                <p className={`text-[10px] uppercase tracking-widest font-semibold ${textSecondary}`}>
                  Valor de Estoque Venda
                </p>
                <h3 className={`text-3xl font-light font-serif mt-2 tracking-wide ${textPrimary}`}>
                  {formatCurrency(inventoryValue, currency)}
                </h3>
              </div>

              <div className={theme === "luxo" ? "p-2.5 rounded-xl bg-amber-500/10" : "p-2.5 rounded-xl bg-stone-100"}>
                <Gem size={18} className={theme === "luxo" ? "text-amber-400" : "text-rose-500"} />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] pt-4 border-t border-neutral-800/40">
              <span className="text-neutral-500">
                Total: <strong className={textPrimary}>{jewelryCount}</strong> peças disponíveis
              </span>
              <button onClick={() => onNavigate("inventory")} className={`flex items-center gap-1 hover:underline cursor-pointer ${textAccent}`}>
                Ver Joias <ArrowRight size={10} />
              </button>
            </div>
          </div>
        )}

        {isVisible("revenue") && (
          <div className={`${cardBg} relative overflow-hidden group hover:border-amber-500/20 transition-all duration-300`}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp size={80} className={theme === "luxo" ? "text-amber-400" : "text-stone-900"} />
            </div>

            <div className="flex justify-between items-start">
              <div>
                <p className={`text-[10px] uppercase tracking-widest font-semibold ${textSecondary}`}>
                  Lucro Líquido do Mês
                </p>
                <h3
                  className={`text-3xl font-light font-serif mt-2 tracking-wide ${
                    monthlyNetProfit >= 0
                      ? theme === "luxo"
                        ? "text-amber-300"
                        : "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {formatCurrency(monthlyNetProfit, currency)}
                </h3>
              </div>

              <div className={theme === "luxo" ? "p-2.5 rounded-xl bg-amber-500/10" : "p-2.5 rounded-xl bg-stone-100"}>
                <TrendingUp size={18} className={theme === "luxo" ? "text-amber-400" : "text-rose-500"} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] pt-4 border-t border-neutral-800/40">
              <div className="flex items-center gap-1 text-emerald-500">
                <ArrowUpRight size={12} />
                <span>Receitas: {formatCurrency(monthlyRevenue, currency)}</span>
              </div>

              <div className="flex items-center gap-1 text-red-400">
                <ArrowDownRight size={12} />
                <span>Despesas: {formatCurrency(monthlyExpenses, currency)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {isVisible("cashflow_chart") && (
        <div className={`${cardBg} flex flex-col justify-between`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className={`text-sm font-semibold uppercase tracking-wider ${textPrimary}`}>
                Desempenho & Distribuição
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                {chartMode === "consolidado"
                  ? "Entradas vs Saídas dos últimos 6 meses."
                  : "Distribuição das despesas por categoria."}
              </p>
            </div>

            <div className="flex p-1 rounded-lg border bg-neutral-950/60 border-neutral-800/80">
              <button
                onClick={() => setChartMode("consolidado")}
                className={`px-3 py-1 text-[10px] uppercase font-mono font-bold tracking-wider rounded-md transition-all ${
                  chartMode === "consolidado"
                    ? "bg-amber-500 text-neutral-950 shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Geral
              </button>

              <button
                onClick={() => setChartMode("categorias")}
                className={`px-3 py-1 text-[10px] uppercase font-mono font-bold tracking-wider rounded-md transition-all ${
                  chartMode === "categorias"
                    ? "bg-amber-500 text-neutral-950 shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Categorias
              </button>
            </div>
          </div>

          <div className="w-full flex items-center justify-center py-2">
            {activePieData.length === 0 || activePieData.every((item) => item.value === 0) ? (
              <div className="p-12 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-xl w-full">
                Sem dados financeiros suficientes para gerar gráfico.
              </div>
            ) : (
              <PieChart
                data={activePieData}
                currency={currency}
                theme={theme}
                centerLabel={chartMode === "consolidado" ? "Saldo 6M" : "Gasto Total"}
                centerValue={
                  chartMode === "consolidado"
                    ? totalRevenue6M - totalExpenses6M
                    : totalExpenses6M
                }
              />
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${cardBg} lg:col-span-2 space-y-6`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className={`text-xs font-semibold uppercase tracking-wider ${textPrimary}`}>
                  Entradas Recentes
                </h4>
                <button onClick={() => onNavigate("finance")} className={`text-[10px] hover:underline flex items-center gap-0.5 ${textAccent}`}>
                  Caixa <ArrowRight size={8} />
                </button>
              </div>

              {recentSales.length === 0 ? (
                <p className="text-xs text-neutral-500 p-4 border border-dashed border-neutral-800 rounded-lg text-center">
                  Nenhuma entrada registrada.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex justify-between items-center text-xs pb-2 border-b border-neutral-800/30">
                      <div className="min-w-0">
                        <p className={`font-medium truncate ${textPrimary}`}>
                          {sale.description || "Entrada sem descrição"}
                        </p>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {parseLocalDate(sale.date).toLocaleDateString("pt-BR")} • {sale.category}
                        </span>
                      </div>

                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="font-mono font-medium text-emerald-400">
                          +{formatCurrency(Number(sale.amount), currency)}
                        </p>
                        <p className="text-[9px] text-neutral-500 font-mono">{sale.subcategory || "Geral"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className={`text-xs font-semibold uppercase tracking-wider ${textPrimary}`}>
                  Gastos Recentes
                </h4>
                <button onClick={() => onNavigate("finance")} className={`text-[10px] hover:underline flex items-center gap-0.5 ${textAccent}`}>
                  Finanças <ArrowRight size={8} />
                </button>
              </div>

              {recentExpenses.length === 0 ? (
                <p className="text-xs text-neutral-500 p-4 border border-dashed border-neutral-800 rounded-lg text-center">
                  Nenhum gasto registrado.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentExpenses.map((exp) => (
                    <div key={exp.id} className="flex justify-between items-center text-xs pb-2 border-b border-neutral-800/30">
                      <div className="min-w-0">
                        <p className={`font-medium truncate ${textPrimary}`}>
                          {exp.description || "Saída sem descrição"}
                        </p>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {parseLocalDate(exp.date).toLocaleDateString("pt-BR")} • {exp.subcategory || "Geral"}
                        </span>
                      </div>

                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="font-mono font-medium text-red-400">
                          -{formatCurrency(Number(exp.amount), currency)}
                        </p>
                        <span className="text-[9px] text-neutral-500 block">{exp.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {isVisible("agenda") && (
            <div className={cardBg}>
              <div className="flex justify-between items-center mb-3">
                <h4 className={`text-xs font-semibold uppercase tracking-wider ${textPrimary}`}>
                  Agenda de Hoje
                </h4>
                <button onClick={() => onNavigate("agenda")} className={`text-[10px] hover:underline ${textAccent}`}>
                  Ver Toda
                </button>
              </div>

              {todayEvents.length === 0 ? (
                <p className="text-xs text-neutral-500 p-4 border border-dashed border-neutral-800 rounded-lg text-center">
                  Nenhum compromisso hoje.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {todayEvents.map((evt) => (
                    <div key={evt.id} className="p-2 bg-neutral-900/60 rounded-lg border border-neutral-800/50 flex gap-2.5 items-start text-xs">
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: evt.color || "#D4AF37" }}
                      />
                      <div className="min-w-0">
                        <p className={`font-medium truncate ${textPrimary}`}>{evt.title}</p>
                        <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                          {evt.time || "Sem horário"} • {evt.location || "Atelier"}
                        </p>
                        {evt.description && (
                          <p className="text-[10px] text-neutral-500 mt-1 line-clamp-2">
                            {evt.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isVisible("notes") && pinnedNotes.length > 0 && (
            <div className={cardBg}>
              <div className="flex justify-between items-center mb-3">
                <h4 className={`text-xs font-semibold uppercase tracking-wider ${textPrimary}`}>
                  Notas Fixadas
                </h4>
                <button onClick={() => onNavigate("notes")} className={`text-[10px] hover:underline ${textAccent}`}>
                  Anotações
                </button>
              </div>

              <div className="space-y-2">
                {pinnedNotes.slice(0, 2).map((note) => (
                  <div key={note.id} className="p-3 bg-neutral-950/40 rounded-xl border border-amber-500/10 text-xs">
                    <div className="flex items-center gap-1 text-[10px] text-amber-400 font-medium mb-1">
                      <Bookmark size={10} fill="currentColor" />
                      <span>{note.tags[0] || "Geral"}</span>
                    </div>
                    <p className={`font-medium ${textPrimary}`}>{note.title}</p>
                    <p className="text-neutral-500 text-[10px] mt-1 line-clamp-2 leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};