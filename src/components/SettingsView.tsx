/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  User,
  Palette,
  Building2,
  DollarSign,
  Check,
} from "lucide-react";
import { UserData } from "../lib/store";

export const formatCurrency = (val: number, currency: string) => {
  const code = currency || "BRL";
  const safeVal = typeof val === "number" && !isNaN(val) ? val : 0;

  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: code,
    }).format(safeVal);
  } catch {
    return `${code} ${safeVal.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}`;
  }
};

interface SettingsProps {
  data: UserData;
  onSaveData: (updatedData: UserData) => void;
  theme?: "luxo" | "claro" | "rubi";
  onChangeTheme?: (newTheme: "luxo" | "claro" | "rubi") => void;
}

export const SettingsView: React.FC<SettingsProps> = ({
  data,
  onSaveData,
  theme = "luxo",
  onChangeTheme,
}) => {
  const settingsAny = data.settings as any;

  const [companyName, setCompanyName] = useState(
    data.settings.companyName || "Blackstone Diamond"
  );
  const [cnpj, setCnpj] = useState(data.settings.cnpj || "");
  const [currency, setCurrency] = useState(data.settings.currency || "BRL");
  const [proLaboreGoal, setProLaboreGoal] = useState(
    data.settings.proLaboreGoal || 15000
  );

  const [userName, setUserName] = useState(
    data.profile?.name || "Membro Blackstone"
  );
  const [userEmail, setUserEmail] = useState(
    data.profile?.email || "admin@blackstone.com"
  );

  const [monthlyRevenueGoal, setMonthlyRevenueGoal] = useState(
    settingsAny.monthlyRevenueGoal || 50000
  );
  const [monthlyProfitGoal, setMonthlyProfitGoal] = useState(
    settingsAny.monthlyProfitGoal || 15000
  );

  const handleSaveConfigs = (e: React.FormEvent) => {
    e.preventDefault();

    onSaveData({
      ...data,
      profile: {
        ...data.profile,
        name: userName,
        email: userEmail,
      },
      settings: {
        ...(data.settings as any),
        companyName,
        cnpj,
        currency,
        proLaboreGoal: Number(proLaboreGoal),
        monthlyRevenueGoal: Number(monthlyRevenueGoal),
        monthlyProfitGoal: Number(monthlyProfitGoal),
        theme,
      } as any,
    });

    const banner = document.getElementById("success-save-banner");

    if (banner) {
      banner.style.opacity = "1";
      setTimeout(() => {
        banner.style.opacity = "0";
      }, 3000);
    }
  };

  const cardBg =
    theme === "luxo"
      ? "bg-neutral-900/40 border border-neutral-800 rounded-xl p-6 shadow-lg backdrop-blur-md"
      : theme === "claro"
      ? "bg-white border border-stone-200 rounded-xl p-6 shadow-sm"
      : "bg-stone-900/90 border border-rose-950/50 rounded-xl p-6 shadow-lg backdrop-blur-md";

  const textPrimary = theme === "claro" ? "text-stone-900" : "text-white";

  const textMuted =
    theme === "claro" ? "text-stone-800 font-medium" : "text-neutral-300";

  const textAccent =
    theme === "luxo"
      ? "text-amber-400"
      : theme === "claro"
      ? "text-stone-800 font-semibold"
      : "text-rose-400";

  const iconAccent =
    theme === "luxo"
      ? "text-amber-400"
      : theme === "claro"
      ? "text-stone-600"
      : "text-rose-400";

  const borderAccent =
    theme === "claro" ? "border-stone-200/80" : "border-neutral-800/40";

  const inputBg =
    theme === "claro"
      ? "w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:border-stone-400 focus:bg-white text-stone-900 rounded focus:outline-none transition-all"
      : "w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-neutral-700 text-neutral-200 rounded focus:outline-none transition-all";

  const buttonPrimary =
    theme === "luxo"
      ? "bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold"
      : theme === "claro"
      ? "bg-stone-900 hover:bg-stone-800 text-white font-medium"
      : "bg-rose-900 hover:bg-rose-800 text-white font-bold";

  const themeOptions = [
    {
      id: "luxo",
      title: "Luxo Noir",
      desc: "Preto profundo, dourado champagne e branco gelo",
      color: "bg-neutral-950 border-amber-500/40",
    },
    {
      id: "claro",
      title: "Claro Marfim",
      desc: "Minimalista com tones off-white e cinzas clássicos",
      color: "bg-stone-50 border-stone-300",
    },
    {
      id: "rubi",
      title: "Rubi Cabernet",
      desc: "Bordô profundo, detalhes rubi e dourado envelhecido",
      color: "bg-gradient-to-br from-[#2a090d] to-[#4a0f18] border-[#7c1024]",
    },
  ] as const;

  return (
    <div className="space-y-6" id="settings-module">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <span className={`text-[10px] uppercase tracking-widest font-semibold ${textAccent}`}>
            Configurações do Sistema
          </span>

          <h1 className={`text-2xl font-serif font-light mt-1 ${textPrimary}`}>
            Preferências & Atelier
          </h1>

          <p className="text-xs text-neutral-500 font-sans">
            Ajuste identidade visual, empresa e metas financeiras.
          </p>
        </div>

        <div
          id="success-save-banner"
          className="opacity-0 transition-opacity duration-300 px-3.5 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold uppercase tracking-wider rounded-lg"
        >
          Configurações salvas com sucesso!
        </div>
      </div>

      <form
        onSubmit={handleSaveConfigs}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="space-y-6 lg:col-span-1">
          <div className={cardBg}>
            <div className={`flex gap-2 items-center mb-4 border-b ${borderAccent} pb-3`}>
              <Palette className={iconAccent} size={16} />
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>
                Identidade Visual
              </h3>
            </div>

            <div className="space-y-3.5">
              {themeOptions.map((th) => (
                <div
                  key={th.id}
                  onClick={() => onChangeTheme && onChangeTheme(th.id)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between ${
                    theme === th.id
                      ? theme === "rubi"
                        ? "border-rose-500 bg-rose-500/5 scale-[1.02]"
                        : "border-amber-500 bg-amber-500/5 scale-[1.02]"
                      : theme === "claro"
                      ? "border-transparent hover:bg-stone-100"
                      : "border-transparent hover:bg-neutral-800/10"
                  }`}
                >
                  <div>
                    <h4 className={`text-xs font-semibold ${textPrimary}`}>
                      {th.title}
                    </h4>

                    <p className="text-[10px] text-neutral-500 mt-0.5 leading-relaxed max-w-[190px]">
                      {th.desc}
                    </p>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border ${th.color} flex items-center justify-center flex-shrink-0`}
                  >
                    {theme === th.id && (
                      <Check
                        size={11}
                        className={theme === "rubi" ? "text-rose-400" : "text-amber-500"}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={cardBg}>
            <div className={`flex gap-2 items-center mb-4 border-b ${borderAccent} pb-3`}>
              <User className={iconAccent} size={16} />
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>
                Perfil Profissional
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                  Nome Completo
                </label>

                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className={inputBg}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                  Email Cadastrado
                </label>

                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className={inputBg}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <div className={cardBg}>
            <div className={`flex gap-2 items-center mb-4 border-b ${borderAccent} pb-3`}>
              <Building2 className={iconAccent} size={16} />
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>
                Empresa / Ourivesaria
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                  Nome Comercial / Grife
                </label>

                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={inputBg}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                  CNPJ de Faturamento
                </label>

                <input
                  type="text"
                  placeholder="00.000.000/0001-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className={`${inputBg} font-mono`}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                  Moeda Principal
                </label>

                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={`${inputBg} cursor-pointer`}
                >
                  <option value="BRL">BRL (R$)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <div className={cardBg}>
            <div className={`flex gap-2 items-center mb-4 border-b ${borderAccent} pb-3`}>
              <DollarSign className={iconAccent} size={16} />
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>
                Planejamento Financeiro
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                  Meta Mensal de Faturamento
                </label>

                <input
                  type="number"
                  value={monthlyRevenueGoal}
                  onChange={(e) => setMonthlyRevenueGoal(Number(e.target.value))}
                  className={`${inputBg} font-mono`}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                  Meta Mensal de Lucro
                </label>

                <input
                  type="number"
                  value={monthlyProfitGoal}
                  onChange={(e) => setMonthlyProfitGoal(Number(e.target.value))}
                  className={`${inputBg} font-mono`}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                  Meta Mensal de Pró-Labore
                </label>

                <input
                  type="number"
                  value={proLaboreGoal}
                  onChange={(e) => setProLaboreGoal(Number(e.target.value))}
                  className={`${inputBg} font-mono`}
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3.5 rounded-xl uppercase tracking-widest text-[10px] transition-all duration-300 cursor-pointer mt-4 ${buttonPrimary}`}
              >
                Gravar Preferências
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};