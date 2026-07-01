/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  X,
  Calculator,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { UserData } from "../lib/store";
import { formatCurrency } from "./SettingsView";
import { api } from "../services/api";

interface FinanceProps {
  data: UserData;
  onSaveData: (updatedData: UserData) => void;
  theme?: "luxo" | "claro" | "rubi";
}

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

// Categorias unificadas — usadas tanto no formulário de movimentação
// quanto no gerenciador de subgrupos, para que nunca fiquem dessincronizadas.
const INCOME_CATEGORIES = ["Venda de joias", "Consertos", "Serviços", "Outras receitas"];
const EXPENSE_CATEGORIES = ["Oficina", "Material da Loja", "Pessoal", "Despesas Fixas"];
const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export const Finance: React.FC<FinanceProps> = ({
  data,
  onSaveData,
  theme = "luxo",
}) => {
  const [cash, setCash] = useState<CashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<"caixa" | "fluxo" | "categorias">("caixa");
  const [periodFilter, setPeriodFilter] = useState<"hoje" | "semana" | "mes" | "ano" | "custom">("mes");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  const [txType, setTxType] = useState<"entrada" | "saida">("entrada");
  const [txCategory, setTxCategory] = useState("Outras receitas");
  const [txSubcategory, setTxSubcategory] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);

  const [withdrawalType, setWithdrawalType] = useState<"fixo" | "percentual">("fixo");
  const [fixedAmount, setFixedAmount] = useState("");
  const [profitPercent, setProfitPercent] = useState("10");
  const [withdrawalNotes, setWithdrawalNotes] = useState("");

  const [selectedParentCategory, setSelectedParentCategory] = useState(ALL_CATEGORIES[0]);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [subcatError, setSubcatError] = useState("");

  const currency = data.settings.currency || "BRL";

  const loadCash = async () => {
    try {
      setLoading(true);
      const response = await api.getCash();
      setCash(response.cash || []);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar caixa.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCash();
  }, []);

  // Faz o parse de uma data "YYYY-MM-DD" (ou ISO completo) como data LOCAL,
  // sem deixar o JS reinterpretar como UTC e "voltar" um dia por causa do fuso horário.
  const parseLocalDate = (dateStr: string) => {
    const datePart = dateStr.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
  };

  const isDateInFilter = (dateStr: string) => {
    const d = parseLocalDate(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dTime = d.getTime();

    if (periodFilter === "hoje") {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return dTime >= today.getTime() && dTime < tomorrow.getTime();
    }

    if (periodFilter === "semana") {
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(today.getDate() - 7);
      return dTime >= oneWeekAgo.getTime();
    }

    if (periodFilter === "mes") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return dTime >= startOfMonth.getTime();
    }

    if (periodFilter === "ano") {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return dTime >= startOfYear.getTime();
    }

    if (periodFilter === "custom") {
      if (!customStartDate || !customEndDate) return true;

      const start = parseLocalDate(customStartDate);
      start.setHours(0, 0, 0, 0);

      const end = parseLocalDate(customEndDate);
      end.setHours(23, 59, 59, 999);

      return dTime >= start.getTime() && dTime <= end.getTime();
    }

    return true;
  };

  const filteredTransactions = cash.filter((t) => isDateInFilter(t.date));

  const totalIn = filteredTransactions
    .filter((t) => t.type === "entrada")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalOut = filteredTransactions
    .filter((t) => t.type === "saida")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const netPeriodProfit = totalIn - totalOut;

  const globalIn = cash
    .filter((t) => t.type === "entrada")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const globalOut = cash
    .filter((t) => t.type === "saida")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const globalCashBalance = globalIn - globalOut;

  const totalGlobalRevenue = globalIn;

  const totalGlobalExpenses = cash
    .filter((t) => t.type === "saida" && t.category !== "Pessoal")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const baseGlobalBusinessProfit = totalGlobalRevenue - totalGlobalExpenses;

  const resetTransactionForm = () => {
    setTxAmount("");
    setTxDescription("");
    setTxSubcategory("");
    setTxDate(new Date().toISOString().split("T")[0]);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!txAmount || !txDescription) return;

    try {
      setSaving(true);

      const response = await api.createCash({
        type: txType,
        category: txCategory,
        subcategory: txSubcategory || "Geral",
        amount: Number(txAmount),
        date: txDate,
        description: txDescription,
      });

      setCash((prev) => [response.transaction, ...prev]);

      setShowAddTransactionModal(false);
      resetTransactionForm();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao cadastrar movimentação.");
    } finally {
      setSaving(false);
    }
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let amountToWithdraw = 0;

    if (withdrawalType === "fixo") {
      amountToWithdraw = parseFloat(fixedAmount) || 0;
    } else {
      const percentage = parseFloat(profitPercent) || 10;
      amountToWithdraw = Math.max(0, (baseGlobalBusinessProfit * percentage) / 100);
    }

    if (amountToWithdraw <= 0) return;

    try {
      setSaving(true);

      const response = await api.createCash({
        type: "saida",
        category: "Pessoal",
        subcategory: withdrawalType === "fixo" ? "Pró-labore" : "Retirada de lucro",
        amount: amountToWithdraw,
        date: new Date().toISOString().split("T")[0],
        description:
          withdrawalNotes ||
          `Retirada de Pró-labore (${
            withdrawalType === "fixo" ? "Fixo" : `${profitPercent}% do Lucro`
          })`,
      });

      setCash((prev) => [response.transaction, ...prev]);

      setShowWithdrawalModal(false);
      setFixedAmount("");
      setWithdrawalNotes("");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao registrar retirada.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTransaction = async (tx: CashItem) => {
    const confirmed = window.confirm(
      `Deseja realmente excluir a movimentação "${tx.description}" do livro caixa?`
    );

    if (!confirmed) return;

    try {
      await api.deleteCash(tx.id);
      setCash((prev) => prev.filter((item) => item.id !== tx.id));
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao excluir movimentação.");
    }
  };

  const handleAddSubcategory = () => {
    setSubcatError("");

    const cleanName = newSubcategoryName.trim();

    if (!cleanName) return;

    const subcatsMap = (data.settings.subcategories || {}) as Record<string, string[]>;

    let isDuplicate = false;

    Object.values(subcatsMap).forEach((subList) => {
      if (
        Array.isArray(subList) &&
        subList.some((s) => s.toLowerCase() === cleanName.toLowerCase())
      ) {
        isDuplicate = true;
      }
    });

    if (isDuplicate) {
      setSubcatError(
        `A subcategoria "${cleanName}" já existe em um grupo de despesas e não pode ser duplicada.`
      );
      return;
    }

    const currentSubs = (subcatsMap[selectedParentCategory] || []) as string[];

    const updatedSubs = {
      ...subcatsMap,
      [selectedParentCategory]: [...currentSubs, cleanName],
    };

    onSaveData({
      ...data,
      settings: {
        ...data.settings,
        subcategories: updatedSubs,
      },
    });

    setNewSubcategoryName("");
  };

  const handleRemoveSubcategory = (parentCat: string, subName: string) => {
    const list = data.settings.subcategories[parentCat] || [];
    const updatedList = list.filter((s) => s !== subName);

    onSaveData({
      ...data,
      settings: {
        ...data.settings,
        subcategories: {
          ...data.settings.subcategories,
          [parentCat]: updatedList,
        },
      },
    });
  };

  const cardBg =
    theme === "luxo"
      ? "bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 shadow-lg backdrop-blur-md"
      : theme === "claro"
      ? "bg-white border border-stone-200 rounded-xl p-5 shadow-xs"
      : "bg-stone-900/90 border border-stone-800 rounded-xl p-5 shadow-lg";

  const textPrimary = theme === "claro" ? "text-stone-900" : "text-white";
  const textAccent =
    theme === "luxo"
      ? "text-amber-400"
      : theme === "claro"
      ? "text-stone-800 font-semibold"
      : "text-rose-400";

  const buttonPrimary =
    theme === "luxo"
      ? "bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold"
      : theme === "claro"
      ? "bg-stone-900 hover:bg-stone-800 text-white font-medium"
      : "bg-rose-900 hover:bg-rose-800 text-white";

  const modalBg =
    theme === "claro"
      ? "bg-white border border-stone-200 text-stone-900"
      : "bg-neutral-900 border border-neutral-800 text-neutral-100";

  const modalOverlayBg =
    theme === "claro"
      ? "bg-stone-900/40 backdrop-blur-xs"
      : "bg-neutral-950/80 backdrop-blur-sm";

  const inputBgClass =
    theme === "claro"
      ? "w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:border-stone-400 focus:bg-white text-stone-900 rounded focus:outline-none transition-all"
      : "w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-neutral-700 text-neutral-200 rounded focus:outline-none transition-all";

  const inputBgCompact =
    theme === "claro"
      ? "px-2.5 py-1 bg-stone-50 border border-stone-200 focus:border-stone-400 focus:bg-white text-stone-900 rounded focus:outline-none transition-all text-xs font-mono"
      : "px-2.5 py-1 bg-neutral-950 border border-neutral-800 focus:border-neutral-700 text-neutral-200 rounded focus:outline-none transition-all text-xs font-mono";

  const inputBtnSec =
    theme === "claro"
      ? "bg-stone-50 text-stone-600 border border-stone-200"
      : "bg-neutral-950 text-neutral-400 border border-neutral-800";

  const tagBg =
    theme === "claro"
      ? "p-4 bg-stone-50 rounded-xl border border-stone-200/60"
      : "p-4 bg-neutral-950/60 rounded-xl border border-neutral-800/60";

  return (
    <div className="space-y-6" id="finance-module">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className={`text-[10px] uppercase tracking-widest font-semibold ${textAccent}`}>
            Fluxo & Pró-Labore
          </span>
          <h1 className={`text-2xl font-serif font-light mt-1 ${textPrimary}`}>
            Gestão Financeira
          </h1>
          <p className="text-xs text-neutral-500">
            Fluxo de caixa salvo no PostgreSQL, retiradas e controle de gastos.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowWithdrawalModal(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs tracking-wider uppercase border transition-all cursor-pointer ${
              theme === "luxo"
                ? "border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:border-amber-500/40"
                : "border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
          >
            <Calculator size={14} className={theme === "luxo" ? "text-amber-400" : "text-current"} />
            Retirar Pró-labore
          </button>

          <button
            onClick={() => {
              setTxType("entrada");
              setTxCategory("Venda de joias");
              setShowAddTransactionModal(true);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs tracking-wider uppercase font-medium cursor-pointer ${buttonPrimary}`}
          >
            <Plus size={14} />
            Nova Movimentação
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className={cardBg}>
          <span className="text-[10px] uppercase tracking-widest text-neutral-500 block">
            Entradas Período
          </span>
          <h3 className="text-2xl font-light font-serif mt-1 text-emerald-400 font-mono">
            {formatCurrency(totalIn, currency)}
          </h3>
          <p className="text-[10px] text-neutral-500 mt-1 font-mono">
            Receitas brutas registradas
          </p>
        </div>

        <div className={cardBg}>
          <span className="text-[10px] uppercase tracking-widest text-neutral-500 block">
            Saídas Período
          </span>
          <h3 className="text-2xl font-light font-serif mt-1 text-red-400 font-mono">
            -{formatCurrency(totalOut, currency)}
          </h3>
          <p className="text-[10px] text-neutral-500 mt-1 font-mono">
            Custos operacionais e retiradas
          </p>
        </div>

        <div className={cardBg}>
          <span className="text-[10px] uppercase tracking-widest text-neutral-500 block">
            Resultado Período
          </span>
          <h3
            className={`text-2xl font-light font-serif mt-1 font-mono ${
              netPeriodProfit >= 0 ? "text-amber-300" : "text-red-500"
            }`}
          >
            {formatCurrency(netPeriodProfit, currency)}
          </h3>
          <p className="text-[10px] text-neutral-500 mt-1 font-mono">
            Saldo líquido das datas filtradas
          </p>
        </div>
      </div>

      <div className="flex overflow-x-auto scrollbar-none whitespace-nowrap flex-nowrap border-b border-neutral-800/60 pb-px -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab("caixa")}
          className={`px-6 py-3 text-xs tracking-widest uppercase font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "caixa"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Livro Caixa
        </button>

        <button
          onClick={() => setActiveTab("fluxo")}
          className={`px-6 py-3 text-xs tracking-widest uppercase font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "fluxo"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Fluxo de Caixa
        </button>

        <button
          onClick={() => setActiveTab("categorias")}
          className={`px-6 py-3 text-xs tracking-widest uppercase font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "categorias"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Estrutura de Despesas
        </button>
      </div>

      {activeTab === "caixa" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-neutral-900/10 p-4 rounded-xl border border-neutral-800/40">
            <div className="flex gap-2 text-xs">
              {(["hoje", "semana", "mes", "ano", "custom"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodFilter(p)}
                  className={`px-3 py-1.5 rounded-lg uppercase tracking-wider text-[9px] font-semibold transition-all cursor-pointer ${
                    periodFilter === p
                      ? "bg-neutral-900 text-amber-400 border border-amber-500/20"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {periodFilter === "custom" && (
              <div className="flex gap-2 text-xs">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className={inputBgCompact}
                />
                <span className="text-neutral-500 self-center">até</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className={inputBgCompact}
                />
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-16 border border-dashed border-neutral-800 rounded-2xl text-center text-xs text-neutral-500">
              <Loader2 className="mx-auto animate-spin text-amber-400 mb-3" size={28} />
              Carregando movimentações do banco...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-16 border border-dashed border-neutral-800 rounded-2xl text-center text-xs text-neutral-500">
              Nenhuma movimentação encontrada para o período filtrado.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-800/60">
              <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                <thead>
                  <tr className="bg-neutral-900 text-neutral-400 uppercase tracking-widest text-[9px]">
                    <th className="p-4">Data</th>
                    <th className="p-4">Descrição</th>
                    <th className="p-4">Categoria / Subgrupo</th>
                    <th className="p-4 text-right">Valor</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-800/40">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-neutral-900/10 transition-colors">
                      <td className="p-4 font-mono text-neutral-400">
                        {parseLocalDate(tx.date).toLocaleDateString("pt-BR")}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {tx.type === "entrada" ? (
                            <ArrowUpCircle size={14} className="text-emerald-400" />
                          ) : (
                            <ArrowDownCircle size={14} className="text-red-400" />
                          )}
                          <span className={`font-medium ${textPrimary}`}>
                            {tx.description || "Sem descrição"}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-[10px] text-neutral-300">
                            {tx.category}
                          </span>
                          <span className="text-[9px] text-neutral-500 font-mono">
                            {tx.subcategory || "Geral"}
                          </span>
                        </div>
                      </td>

                      <td
                        className={`p-4 text-right font-mono font-medium text-xs ${
                          tx.type === "entrada" ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {tx.type === "entrada" ? "+" : "-"}
                        {formatCurrency(Number(tx.amount), currency)}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteTransaction(tx)}
                          className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 transition-colors cursor-pointer"
                          title="Excluir movimentação"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "fluxo" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={cardBg}>
            <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${textPrimary}`}>
              Comparativo de Caixa
            </h3>

            <div className="h-64 flex items-center justify-center relative">
              {totalIn === 0 && totalOut === 0 ? (
                <span className="text-xs text-neutral-500">Sem dados para plotagem.</span>
              ) : (
                <svg width="200" height="200" viewBox="0 0 100 100" className="-rotate-90">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#222222" strokeWidth="6" />
                  {totalIn > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="6"
                      strokeDasharray={`${(totalIn / Math.max(1, totalIn + totalOut)) * 251.2} 251.2`}
                    />
                  )}
                </svg>
              )}

              <div className="absolute text-center">
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">
                  Receitas
                </span>
                <span className="text-sm font-mono font-bold text-emerald-400">
                  {((totalIn / Math.max(1, totalIn + totalOut)) * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="flex justify-around text-xs mt-4 pt-4 border-t border-neutral-800/40">
              <span className="text-neutral-400">
                Entradas: {formatCurrency(totalIn, currency)}
              </span>
              <span className="text-neutral-400">
                Despesas: {formatCurrency(totalOut, currency)}
              </span>
            </div>
          </div>

          <div className={cardBg}>
            <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${textPrimary}`}>
              Análise de Lucratividade
            </h3>

            <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
              O lucro operacional antes de retiradas mostra a saúde real da oficina.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400">Faturamento Realizado</span>
                  <span className="font-mono text-neutral-200">
                    {formatCurrency(totalIn, currency)}
                  </span>
                </div>
                <div className="w-full h-2 rounded overflow-hidden bg-neutral-950">
                  <div className="bg-emerald-500 h-full rounded" style={{ width: "100%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400">Custos Operacionais</span>
                  <span className="font-mono text-red-400">
                    {((totalOut / Math.max(1, totalIn)) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded overflow-hidden bg-neutral-950">
                  <div
                    className="bg-red-500 h-full rounded"
                    style={{
                      width: `${Math.min(100, (totalOut / Math.max(1, totalIn)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "categorias" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${cardBg} lg:col-span-1`}>
            <h3 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${textPrimary}`}>
              Adicionar Subgrupo
            </h3>

            <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
              Esta parte ainda usa configurações locais. Vamos migrar Settings depois.
            </p>

            {subcatError && (
              <div className="mb-4 p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex gap-2 items-start">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{subcatError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <select
                value={selectedParentCategory}
                onChange={(e) => setSelectedParentCategory(e.target.value)}
                className={`${inputBgClass} cursor-pointer`}
              >
                <optgroup label="Entradas">
                  {INCOME_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Saídas">
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </optgroup>
              </select>

              <input
                type="text"
                placeholder="Ex: Banho Químico"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                className={inputBgClass}
              />

              <button
                type="button"
                onClick={handleAddSubcategory}
                className={`w-full py-2 rounded text-xs font-semibold cursor-pointer ${buttonPrimary}`}
              >
                Vincular Subgrupo
              </button>
            </div>
          </div>

          <div className={`${cardBg} lg:col-span-2 space-y-4`}>
            <h3 className={`text-sm font-semibold uppercase tracking-wider ${textPrimary}`}>
              Organograma de Despesas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ALL_CATEGORIES.map((parent) => {
                const list = (data.settings.subcategories?.[parent] || []) as string[];
                return (
                  <div key={parent} className={tagBg}>
                    <span className={`text-[10px] uppercase tracking-widest font-semibold block mb-2 ${textAccent}`}>
                      {parent}
                    </span>

                    {list.length === 0 ? (
                      <span className="text-[10px] text-neutral-500">
                        Sem subgrupos vinculados.
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {list.map((sub, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] rounded font-mono group border bg-neutral-900 border-neutral-800 text-neutral-300"
                          >
                            {sub}
                            <button
                              onClick={() => handleRemoveSubcategory(parent, sub)}
                              className="text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showAddTransactionModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${modalOverlayBg}`}>
          <div className={`w-full max-w-md rounded-2xl p-6 border ${modalBg}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-serif font-light tracking-wider">
                Nova Entrada / Saída de Caixa
              </h3>

              <button
                onClick={() => setShowAddTransactionModal(false)}
                className="text-neutral-500 hover:text-stone-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTxType("entrada");
                    setTxCategory("Venda de joias");
                    setTxSubcategory("");
                  }}
                  className={`py-2 text-xs font-semibold rounded uppercase tracking-wider transition-all cursor-pointer ${
                    txType === "entrada" ? "bg-emerald-500 text-neutral-950" : inputBtnSec
                  }`}
                >
                  Entrada
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTxType("saida");
                    setTxCategory("Oficina");
                    setTxSubcategory("");
                  }}
                  className={`py-2 text-xs font-semibold rounded uppercase tracking-wider transition-all cursor-pointer ${
                    txType === "saida" ? "bg-red-500 text-neutral-950" : inputBtnSec
                  }`}
                >
                  Saída
                </button>
              </div>

              <select
                value={txCategory}
                onChange={(e) => {
                  setTxCategory(e.target.value);
                  setTxSubcategory("");
                }}
                className={`${inputBgClass} cursor-pointer`}
              >
                {(txType === "entrada" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={txSubcategory}
                onChange={(e) => setTxSubcategory(e.target.value)}
                className={`${inputBgClass} cursor-pointer`}
              >
                <option value="">Nenhum subgrupo</option>
                {(data.settings.subcategories?.[txCategory] || []).map((sub, i) => (
                  <option key={i} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  required
                  placeholder={`Valor (${currency})`}
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className={`${inputBgClass} font-mono`}
                />

                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className={`${inputBgClass} font-mono`}
                />
              </div>

              <input
                type="text"
                required
                placeholder="Descrição / histórico"
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
                className={inputBgClass}
              />

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-neutral-950 font-bold uppercase tracking-widest rounded-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Salvando..." : "Vincular Transação"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showWithdrawalModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${modalOverlayBg}`}>
          <div className={`w-full max-w-md rounded-2xl p-6 border ${modalBg}`}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Calculator size={18} className="text-amber-400" />
                <h3 className="text-base font-serif font-light tracking-wider">
                  Retirada de Pró-labore
                </h3>
              </div>

              <button
                onClick={() => setShowWithdrawalModal(false)}
                className="text-neutral-500 hover:text-stone-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-5 p-3.5 rounded-xl border text-xs bg-neutral-950 border-neutral-800">
              <span className="text-[10px] text-neutral-500 block mb-0.5">
                Diagnóstico Base Blackstone
              </span>
              <span className="font-medium block text-sm text-neutral-200">
                Faturamento Bruto: {formatCurrency(totalGlobalRevenue, currency)}
              </span>
              <span className="font-medium block text-sm mt-1 text-neutral-200">
                Custos de Operação: {formatCurrency(totalGlobalExpenses, currency)}
              </span>
              <span className="font-medium block text-sm mt-1 pt-2 border-t font-mono text-amber-300 border-neutral-800">
                Lucro Operacional Base: {formatCurrency(baseGlobalBusinessProfit, currency)}
              </span>
            </div>

            <form onSubmit={handleWithdrawalSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWithdrawalType("fixo")}
                  className={`py-2 text-xs font-semibold rounded uppercase tracking-wider transition-all cursor-pointer ${
                    withdrawalType === "fixo" ? "bg-amber-500 text-neutral-950" : inputBtnSec
                  }`}
                >
                  Valor Fixo
                </button>

                <button
                  type="button"
                  onClick={() => setWithdrawalType("percentual")}
                  className={`py-2 text-xs font-semibold rounded uppercase tracking-wider transition-all cursor-pointer ${
                    withdrawalType === "percentual"
                      ? "bg-amber-500 text-neutral-950"
                      : inputBtnSec
                  }`}
                >
                  Percentual
                </button>
              </div>

              {withdrawalType === "fixo" ? (
                <input
                  type="number"
                  required
                  placeholder={`Valor do pró-labore (${currency})`}
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                  className={`${inputBgClass} text-sm font-mono`}
                />
              ) : (
                <div>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={profitPercent}
                    onChange={(e) => setProfitPercent(e.target.value)}
                    className={`${inputBgClass} text-sm font-mono`}
                  />
                  <div className="mt-2 text-[10px] text-neutral-400">
                    Valor estimado:{" "}
                    <strong className="text-amber-400 font-mono">
                      {formatCurrency(
                        (baseGlobalBusinessProfit * (parseFloat(profitPercent) || 0)) / 100,
                        currency
                      )}
                    </strong>
                  </div>
                </div>
              )}

              <textarea
                rows={2}
                placeholder="Observações da retirada"
                value={withdrawalNotes}
                onChange={(e) => setWithdrawalNotes(e.target.value)}
                className={inputBgClass}
              />

              <div className="pt-4 border-t border-neutral-800/60">
                <div className="flex justify-between items-center text-xs mb-4">
                  <span className="text-neutral-500">Saldo Atual Caixa:</span>
                  <span className="font-mono text-neutral-300">
                    {formatCurrency(globalCashBalance, currency)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-neutral-950 font-bold uppercase tracking-widest rounded-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? "Salvando..." : "Concluir Retirada & Lançar Despesa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};