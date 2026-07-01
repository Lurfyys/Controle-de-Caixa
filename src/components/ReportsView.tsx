/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import {
  FileText,
  Printer,
  Loader2,
} from "lucide-react";
import { UserData } from "../lib/store";
import { formatCurrency } from "./SettingsView";
import { PieChart } from "./PieChart";
import { api } from "../services/api";

interface ReportsProps {
  data: UserData;
  theme?: "luxo" | "claro" | "rubi";
}

type CashItem = {
  id: string;
  type: "entrada" | "saida";
  category: string;
  subcategory?: string | null;
  amount: number;
  description?: string | null;
  date: string;
};

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  weight?: number | null;
  goldType?: string | null;
  gem?: string | null;
  costPrice: number;
  sellPrice: number;
  quantity?: number;
  status: string;
};

export const ReportsView: React.FC<ReportsProps> = ({
  data,
  theme = "luxo",
}) => {
  const [reportType, setReportType] = useState<"completo" | "financeiro" | "estoque">("completo");
  const [chartMode, setChartMode] = useState<"consolidado" | "categorias">("consolidado");
  const [cash, setCash] = useState<CashItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const currency = data.settings.currency || "BRL";

  useEffect(() => {
    async function loadReportsData() {
      try {
        setLoading(true);

        const [cashRes, inventoryRes] = await Promise.all([
          api.getCash(),
          api.getInventory(),
        ]);

        setCash(cashRes.cash || []);
        setInventory(inventoryRes.inventory || []);
      } catch (error) {
        console.error(error);
        alert("Erro ao carregar dados dos relatórios.");
      } finally {
        setLoading(false);
      }
    }

    loadReportsData();
  }, []);

  const parseLocalDate = (dateStr: string) => {
    const datePart = dateStr.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
  };

  const totalInflow = cash
    .filter((tx) => tx.type === "entrada")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const totalOutflow = cash
    .filter((tx) => tx.type === "saida")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const netBalance = totalInflow - totalOutflow;

  const availableInventory = inventory.filter((item) => item.status === "Disponível");

  const currentInventoryValue = availableInventory.reduce(
    (sum, item) => sum + Number(item.sellPrice || 0) * Number(item.quantity || 1),
    0
  );

  const currentInventoryCost = availableInventory.reduce(
    (sum, item) => sum + Number(item.costPrice || 0) * Number(item.quantity || 1),
    0
  );

  const expectedProfit = currentInventoryValue - currentInventoryCost;

  const getChartData = () => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const currentMonthIdx = new Date().getMonth();
    const currentYear = new Date().getFullYear();

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

  const expensesPieData = Object.keys(expensesByCategory)
    .map((cat, idx) => ({
      name: cat,
      value: expensesByCategory[cat],
      color: categoryColors[idx % categoryColors.length],
    }))
    .filter((item) => item.value > 0);

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
  ].filter((item) => item.value > 0);

  const activePieData =
    chartMode === "consolidado" ? consolidatedPieData : expensesPieData;

  const handlePrintReport = () => {
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      window.print();
      return;
    }

    const companyName = data.settings.companyName || "BLACKSTONE DIAMOND";
    const dateStr = new Date().toLocaleDateString("pt-BR");

    const formatMoney = (val: number) => formatCurrency(val || 0, currency);

    const cashRows = cash
      .map(
        (tx) => `
        <tr>
          <td>${parseLocalDate(tx.date).toLocaleDateString("pt-BR")}</td>
          <td>${tx.description || "-"}</td>
          <td>${tx.category} ${tx.subcategory ? "• " + tx.subcategory : ""}</td>
          <td class="${tx.type === "entrada" ? "green" : "red"}">
            ${tx.type === "entrada" ? "+" : "-"}${formatMoney(Number(tx.amount))}
          </td>
        </tr>
      `
      )
      .join("");

    const inventoryRows = inventory
      .map(
        (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.category}</td>
          <td>${item.goldType || "-"}</td>
          <td>${item.gem || "-"}</td>
          <td>${Number(item.weight || 0).toFixed(2)}g</td>
          <td>${formatMoney(Number(item.costPrice || 0))}</td>
          <td>${formatMoney(Number(item.sellPrice || 0))}</td>
          <td>${item.status}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Relatório ${companyName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #111;
            padding: 40px;
          }

          .header {
            border-bottom: 2px solid #111;
            padding-bottom: 18px;
            margin-bottom: 30px;
          }

          h1 {
            margin: 0;
            font-size: 24px;
            letter-spacing: 2px;
            text-transform: uppercase;
          }

          .sub {
            color: #666;
            font-size: 12px;
            margin-top: 6px;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
            margin-bottom: 30px;
          }

          .card {
            border: 1px solid #ddd;
            padding: 14px;
            border-radius: 8px;
            background: #fafafa;
          }

          .label {
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .value {
            font-size: 18px;
            font-weight: bold;
            margin-top: 6px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }

          th {
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            border-bottom: 2px solid #ddd;
            padding: 8px;
            background: #f7f7f7;
          }

          td {
            font-size: 11px;
            padding: 8px;
            border-bottom: 1px solid #eee;
          }

          .green {
            color: #059669;
            font-weight: bold;
            text-align: right;
          }

          .red {
            color: #dc2626;
            font-weight: bold;
            text-align: right;
          }

          .section {
            margin-top: 30px;
            margin-bottom: 12px;
            font-size: 16px;
            border-bottom: 1px solid #111;
            padding-bottom: 6px;
            text-transform: uppercase;
          }

          .print-btn {
            margin-bottom: 20px;
            padding: 10px 18px;
            border: none;
            background: #d97706;
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
          }

          @media print {
            .print-btn {
              display: none;
            }

            body {
              padding: 0;
            }
          }
        </style>
      </head>

      <body>
        <button class="print-btn" onclick="window.print()">Imprimir / Salvar PDF</button>

        <div class="header">
          <h1>${companyName}</h1>
          <div class="sub">Relatório Executivo • Emitido em ${dateStr}</div>
        </div>

        <div class="section">Resumo Financeiro</div>

        <div class="grid">
          <div class="card">
            <div class="label">Entradas</div>
            <div class="value" style="color:#059669">${formatMoney(totalInflow)}</div>
          </div>

          <div class="card">
            <div class="label">Saídas</div>
            <div class="value" style="color:#dc2626">${formatMoney(totalOutflow)}</div>
          </div>

          <div class="card">
            <div class="label">Saldo Líquido</div>
            <div class="value" style="color:${netBalance >= 0 ? "#059669" : "#dc2626"}">${formatMoney(netBalance)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th style="text-align:right">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${cashRows || `<tr><td colspan="4">Nenhuma movimentação registrada.</td></tr>`}
          </tbody>
        </table>

        <div class="section">Inventário Patrimonial</div>

        <div class="grid">
          <div class="card">
            <div class="label">Custo do Estoque</div>
            <div class="value">${formatMoney(currentInventoryCost)}</div>
          </div>

          <div class="card">
            <div class="label">Valor de Venda</div>
            <div class="value">${formatMoney(currentInventoryValue)}</div>
          </div>

          <div class="card">
            <div class="label">Lucro Estimado</div>
            <div class="value" style="color:#059669">${formatMoney(expectedProfit)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Joia</th>
              <th>Categoria</th>
              <th>Ouro</th>
              <th>Pedra</th>
              <th>Peso</th>
              <th>Custo</th>
              <th>Venda</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${inventoryRows || `<tr><td colspan="8">Nenhuma joia registrada.</td></tr>`}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 600);
  };

  const cardBg =
    theme === "luxo"
      ? "bg-neutral-900/40 border border-neutral-800 rounded-xl p-5"
      : theme === "claro"
      ? "bg-white border border-stone-200 rounded-xl p-5 shadow-sm"
      : "bg-stone-900/90 border border-stone-800 rounded-xl p-5";

  const textPrimary = theme === "claro" ? "text-stone-900" : "text-white";

  const textAccent =
    theme === "luxo"
      ? "text-amber-400"
      : theme === "claro"
      ? "text-stone-800 font-semibold"
      : "text-rose-400";

  const buttonPrimary =
    theme === "luxo"
      ? "bg-amber-500 hover:bg-amber-600 text-neutral-950 font-medium"
      : theme === "claro"
      ? "bg-neutral-900 hover:bg-neutral-800 text-white"
      : "bg-rose-900 hover:bg-rose-800 text-white";

  if (loading) {
    return (
      <div className="p-16 border border-dashed border-neutral-800 rounded-2xl text-center text-xs text-neutral-500">
        <Loader2 className="mx-auto animate-spin text-amber-400 mb-3" size={28} />
        Carregando relatórios com dados reais do banco...
      </div>
    );
  }

  return (
    <div className="space-y-6" id="reports-module">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <span className={`text-[10px] uppercase tracking-widest font-semibold ${textAccent}`}>
            Diligência Corporativa
          </span>

          <h1 className={`text-2xl font-serif font-light mt-1 ${textPrimary}`}>
            Relatórios Executivos
          </h1>

          <p className="text-xs text-neutral-500">
            Relatórios baseados em Caixa e Inventário reais do PostgreSQL.
          </p>
        </div>

        <button
          onClick={handlePrintReport}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer font-medium ${buttonPrimary}`}
        >
          <Printer size={14} />
          Exportar Relatório PDF
        </button>
      </div>

      <div className="flex overflow-x-auto scrollbar-none whitespace-nowrap flex-nowrap gap-2 bg-neutral-950/40 p-1 rounded-xl border border-neutral-800/40 no-print text-[10px] font-semibold uppercase tracking-wider">
        {[
          { key: "completo", label: "Relatório Completo" },
          { key: "financeiro", label: "Balanço Financeiro" },
          { key: "estoque", label: "Inventário Patrimonial" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setReportType(item.key as any)}
            className={`px-4 py-2.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
              reportType === item.key
                ? theme === "luxo"
                  ? "bg-neutral-900 text-amber-400 border border-amber-500/20"
                  : "bg-stone-800 text-white"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div id="print-area" className="space-y-6">
        <div className="border-b border-neutral-800 pb-5 mb-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div>
              <h2 className="text-2xl font-serif font-light tracking-widest text-neutral-100 uppercase">
                {data.settings.companyName || "BLACKSTONE DIAMOND"}
              </h2>

              <p className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">
                Relatório Corporativo • {reportType === "completo"
                  ? "Geral Consolidado"
                  : reportType === "financeiro"
                  ? "Fluxo de Caixa"
                  : "Inventário Patrimonial"}
              </p>
            </div>

            <div className="text-right text-[10px] text-neutral-500 font-mono mt-4 sm:mt-0">
              <p>Emitido em: {new Date().toLocaleDateString("pt-BR")}</p>
              <p>ID Operador: {data.profile?.email || "Administrador"}</p>
            </div>
          </div>
        </div>

        {(reportType === "financeiro" || reportType === "completo") && (
          <div className="space-y-6">
            <div className="border-b border-neutral-800/40 pb-2 mb-4">
              <h2 className={`text-xs uppercase tracking-widest font-semibold font-mono ${textAccent}`}>
                Seção I: Balanço Financeiro Geral
              </h2>
            </div>

            <div className={`${cardBg} grid grid-cols-1 lg:grid-cols-3 gap-6 items-center`}>
              <div className="lg:col-span-1 space-y-2">
                <span className={`text-[10px] uppercase tracking-widest font-semibold ${textAccent}`}>
                  Dashboard Executivo
                </span>

                <h3 className="text-sm font-serif font-light text-neutral-200 uppercase tracking-wider">
                  Desempenho & Distribuição
                </h3>

                <p className="text-xs text-neutral-400">
                  {chartMode === "consolidado"
                    ? "Entradas vs Saídas dos últimos 6 meses."
                    : "Distribuição das despesas por categoria."}
                </p>

                <div className="inline-flex p-0.5 rounded-md border mt-2 bg-neutral-950/60 border-neutral-800/80">
                  <button
                    onClick={() => setChartMode("consolidado")}
                    className={`px-2.5 py-0.5 text-[9px] uppercase font-mono font-bold tracking-wider rounded-sm transition-all ${
                      chartMode === "consolidado"
                        ? "bg-amber-500 text-neutral-950"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Geral
                  </button>

                  <button
                    onClick={() => setChartMode("categorias")}
                    className={`px-2.5 py-0.5 text-[9px] uppercase font-mono font-bold tracking-wider rounded-sm transition-all ${
                      chartMode === "categorias"
                        ? "bg-amber-500 text-neutral-950"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Categorias
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2 flex items-center justify-center">
                {activePieData.length === 0 ? (
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={cardBg}>
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 block font-mono">
                  Entradas Consolidadas
                </span>
                <span className="text-2xl font-serif text-emerald-400 font-light mt-2 block">
                  {formatCurrency(totalInflow, currency)}
                </span>
              </div>

              <div className={cardBg}>
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 block font-mono">
                  Saídas Consolidadas
                </span>
                <span className="text-2xl font-serif text-red-400 font-light mt-2 block">
                  {formatCurrency(totalOutflow, currency)}
                </span>
              </div>

              <div className={cardBg}>
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 block font-mono">
                  Saldo Líquido
                </span>
                <span className={`text-2xl font-serif font-light mt-2 block ${netBalance >= 0 ? "text-amber-400" : "text-red-400"}`}>
                  {formatCurrency(netBalance, currency)}
                </span>
              </div>
            </div>

            <div className={cardBg}>
              <h3 className="text-xs font-serif font-light tracking-widest text-neutral-300 uppercase mb-4">
                Extrato Histórico Detalhado
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-neutral-400 min-w-[650px]">
                  <thead>
                    <tr className="border-b border-neutral-800 text-[10px] uppercase tracking-wider font-mono text-neutral-500">
                      <th className="text-left pb-2 font-normal">Data</th>
                      <th className="text-left pb-2 font-normal">Descrição</th>
                      <th className="text-left pb-2 font-normal">Categoria</th>
                      <th className="text-right pb-2 font-normal">Tipo</th>
                      <th className="text-right pb-2 font-normal">Valor</th>
                    </tr>
                  </thead>

                  <tbody>
                    {cash.map((tx) => (
                      <tr key={tx.id} className="border-b border-neutral-800/40">
                        <td className="py-2.5 font-mono">
                          {parseLocalDate(tx.date).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-2.5 font-light text-neutral-200">
                          {tx.description || "-"}
                        </td>
                        <td className="py-2.5">
                          {tx.category} {tx.subcategory ? `• ${tx.subcategory}` : ""}
                        </td>
                        <td className={`py-2.5 text-right uppercase font-mono ${tx.type === "entrada" ? "text-emerald-400" : "text-red-400"}`}>
                          {tx.type}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold">
                          {formatCurrency(Number(tx.amount), currency)}
                        </td>
                      </tr>
                    ))}

                    {cash.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-neutral-600">
                          Não há registros de caixa lançados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {(reportType === "estoque" || reportType === "completo") && (
          <div className="space-y-6">
            <div className="border-b border-neutral-800/40 pb-2 mb-4">
              <h2 className={`text-xs uppercase tracking-widest font-semibold font-mono ${textAccent}`}>
                Seção II: Inventário Patrimonial
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={cardBg}>
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 block font-mono">
                  Custo do Estoque
                </span>
                <span className="text-2xl font-serif text-neutral-300 font-light mt-2 block">
                  {formatCurrency(currentInventoryCost, currency)}
                </span>
              </div>

              <div className={cardBg}>
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 block font-mono">
                  Valor Comercial
                </span>
                <span className="text-2xl font-serif text-amber-400 font-light mt-2 block">
                  {formatCurrency(currentInventoryValue, currency)}
                </span>
              </div>

              <div className={cardBg}>
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 block font-mono">
                  Lucro Potencial
                </span>
                <span className="text-2xl font-serif text-emerald-400 font-light mt-2 block">
                  {formatCurrency(expectedProfit, currency)}
                </span>
              </div>
            </div>

            <div className={cardBg}>
              <h3 className="text-xs font-serif font-light tracking-widest text-neutral-300 uppercase mb-4">
                Portfólio de Joias
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-neutral-400 min-w-[650px]">
                  <thead>
                    <tr className="border-b border-neutral-800 text-[10px] uppercase tracking-wider font-mono text-neutral-500">
                      <th className="text-left pb-2 font-normal">Peça</th>
                      <th className="text-left pb-2 font-normal">Categoria</th>
                      <th className="text-left pb-2 font-normal">Ouro</th>
                      <th className="text-center pb-2 font-normal">Pedra</th>
                      <th className="text-center pb-2 font-normal">Peso</th>
                      <th className="text-right pb-2 font-normal">Custo</th>
                      <th className="text-right pb-2 font-normal">Venda</th>
                      <th className="text-right pb-2 font-normal">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {inventory.map((item) => (
                      <tr key={item.id} className="border-b border-neutral-800/40">
                        <td className="py-2.5 font-light text-neutral-200">
                          {item.name}
                        </td>
                        <td className="py-2.5">{item.category}</td>
                        <td className="py-2.5">{item.goldType || "-"}</td>
                        <td className="py-2.5 text-center">{item.gem || "-"}</td>
                        <td className="py-2.5 text-center font-mono">
                          {Number(item.weight || 0).toFixed(2)}g
                        </td>
                        <td className="py-2.5 text-right font-mono">
                          {formatCurrency(Number(item.costPrice), currency)}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-amber-400">
                          {formatCurrency(Number(item.sellPrice), currency)}
                        </td>
                        <td className="py-2.5 text-right font-mono">
                          {item.status}
                        </td>
                      </tr>
                    ))}

                    {inventory.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-neutral-600">
                          Nenhuma joia registrada no estoque.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};