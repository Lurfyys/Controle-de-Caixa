/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { Logo } from "./Logo";
import { BlackstoneDB } from "../lib/store";
import { api } from "../services/api";
import { User } from "../types";

interface AuthProps {
  onAuthSuccess: (user: User) => void;
  theme?: "luxo" | "claro" | "rubi";
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, theme = "luxo" }) => {
  const [mode, setMode] = useState<"login" | "register" | "recover" | "reset-prompt">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [recoverEmail, setRecoverEmail] = useState("");
  const [securityQuestionText, setSecurityQuestionText] = useState("");
  const [recoveryAnswerInput, setRecoveryAnswerInput] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.login({ email, password });

      setSuccess("Login realizado. Entrando no sistema...");

      setTimeout(() => {
        onAuthSuccess(response.user);
      }, 500);
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password || !name) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.register({
        name,
        email,
        password,
        companyName: companyName || `${name} Joias`,
      });

      setSuccess(response.message || "Cadastro criado com sucesso.");

      setTimeout(() => {
        setMode("login");
        setEmail(email);
        setPassword("");
        setSuccess("Cadastro criado com sucesso. Agora faça login.");
      }, 900);
    } catch (err: any) {
      setError(err.message || "Erro ao cadastrar usuário.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!recoverEmail) {
      setError("Por favor, insira o seu e-mail.");
      return;
    }

    const res = BlackstoneDB.getSecurityQuestion(recoverEmail);

    if (res.success && res.question) {
      setSecurityQuestionText(res.question);
      setMode("reset-prompt");
    } else {
      setError(res.message || "Erro ao buscar pergunta.");
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!recoveryAnswerInput || !newPassword) {
      setError("Preencha a resposta e a nova senha.");
      return;
    }

    const res = BlackstoneDB.recoverPassword(
      recoverEmail,
      recoveryAnswerInput,
      newPassword
    );

    if (res.success) {
      setSuccess(res.message);

      setTimeout(() => {
        setMode("login");
        setPassword("");
        setEmail(recoverEmail);
        setSuccess("");
      }, 1500);
    } else {
      setError(res.message);
    }
  };

  const panelBg =
    theme === "luxo"
      ? "bg-neutral-900/90 border border-amber-500/20 text-neutral-100 shadow-[0_0_50px_rgba(212,175,55,0.08)]"
      : theme === "claro"
      ? "bg-stone-50 border border-stone-200 text-stone-900 shadow-xl"
      : "bg-stone-950/95 border border-rose-950 text-stone-100 shadow-2xl";

  const buttonPrimary =
    theme === "luxo"
      ? "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-medium tracking-wider shadow-lg shadow-amber-500/10 cursor-pointer transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
      : theme === "claro"
      ? "bg-neutral-900 hover:bg-neutral-800 text-white font-medium tracking-wide cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      : "bg-rose-900 hover:bg-rose-800 text-white font-medium tracking-wide cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

  const inputBg =
    theme === "luxo"
      ? "bg-neutral-950/60 border-neutral-800 focus:border-amber-500 text-neutral-100"
      : "bg-white border-stone-300 focus:border-stone-900 text-stone-900";

  const renderButtonContent = (text: string, loadingText: string) => {
    if (!loading) return text;

    return (
      <span className="flex items-center justify-center gap-2">
        <Loader2 size={14} className="animate-spin" />
        {loadingText}
      </span>
    );
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-center items-center px-4 transition-colors duration-700 py-12 ${
        theme === "luxo"
          ? "bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900"
          : theme === "claro"
          ? "bg-stone-100/70"
          : "bg-stone-950"
      }`}
    >
      <div className="mb-8 text-center animate-fade-in">
        <Logo size={70} showText={true} theme={theme} className="justify-center scale-105" />

        <p className="text-xs mt-3 tracking-[0.2em] font-light text-neutral-500">
          SISTEMA INTEGRADO DE GESTÃO E OFICINA
        </p>
      </div>

      <div className={`w-full max-w-md rounded-2xl p-8 backdrop-blur-xl transition-all duration-500 ${panelBg}`}>
        <div className="mb-6 text-center">
          <h2 className="text-xl font-sans tracking-widest font-light">
            {mode === "login" && "CONECTAR AO PORTAL"}
            {mode === "register" && "REGISTRAR NOVO ATELIER"}
            {mode === "recover" && "RECUPERAR CREDENCIAIS"}
            {mode === "reset-prompt" && "VALIDAR IDENTIDADE"}
          </h2>

          <div
            className={`h-[1px] w-12 mx-auto mt-3 ${
              theme === "luxo" ? "bg-amber-500" : "bg-rose-800"
            }`}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-center">
            {success}
          </div>
        )}

        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              required
              placeholder="E-mail"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all disabled:opacity-60 ${inputBg}`}
            />

            <input
              type="password"
              required
              placeholder="Senha"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all disabled:opacity-60 ${inputBg}`}
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-lg text-xs uppercase tracking-[0.2em] font-semibold ${buttonPrimary}`}
            >
              {renderButtonContent("Autenticar", "Autenticando...")}
            </button>
          </form>
        )}

        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="text"
              required
              placeholder="Seu nome"
              value={name}
              disabled={loading}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all disabled:opacity-60 ${inputBg}`}
            />

            <input
              type="email"
              required
              placeholder="nome@empresa.com"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all disabled:opacity-60 ${inputBg}`}
            />

            <input
              type="text"
              placeholder="Nome da Joalheria"
              value={companyName}
              disabled={loading}
              onChange={(e) => setCompanyName(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all disabled:opacity-60 ${inputBg}`}
            />

            <input
              type="password"
              required
              placeholder="Senha"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all disabled:opacity-60 ${inputBg}`}
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-lg text-xs uppercase tracking-[0.2em] font-semibold ${buttonPrimary}`}
            >
              {renderButtonContent("Criar Meu Atelier", "Criando atelier...")}
            </button>
          </form>
        )}

        {mode === "recover" && (
          <form onSubmit={handleFetchQuestion} className="space-y-4">
            <input
              type="email"
              required
              placeholder="E-mail cadastrado"
              value={recoverEmail}
              onChange={(e) => setRecoverEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all ${inputBg}`}
            />

            <button
              type="submit"
              className={`w-full py-3.5 rounded-lg text-xs uppercase tracking-[0.2em] font-semibold ${buttonPrimary}`}
            >
              Buscar Pergunta
            </button>
          </form>
        )}

        {mode === "reset-prompt" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-xs text-amber-300 text-center">
              {securityQuestionText}
            </p>

            <input
              type="text"
              required
              placeholder="Resposta"
              value={recoveryAnswerInput}
              onChange={(e) => setRecoveryAnswerInput(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all ${inputBg}`}
            />

            <input
              type="password"
              required
              placeholder="Nova senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all ${inputBg}`}
            />

            <button
              type="submit"
              className={`w-full py-3.5 rounded-lg text-xs uppercase tracking-[0.2em] font-semibold ${buttonPrimary}`}
            >
              Redefinir Chave
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-neutral-800/60 flex flex-col items-center gap-3">
          {mode === "login" ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setError("");
                setSuccess("");
                setMode("register");
              }}
              className="text-xs text-amber-400 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Registrar Atelier
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setError("");
                setSuccess("");
                setMode("login");
              }}
              className="text-xs text-amber-400 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Voltar ao Login
            </button>
          )}
        </div>
      </div>

      <p className="mt-8 text-[10px] text-neutral-500 tracking-wider text-center">
        © 2026 BLACKSTONE DIAMOND ERP • TECNOLOGIA PARA ALTA JOALHERIA
      </p>
    </div>
  );
};