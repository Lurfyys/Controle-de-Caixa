/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import {
  Plus,
  Clock,
  X,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckSquare,
} from "lucide-react";
import { UserData } from "../lib/store";
import { api } from "../services/api";

interface KanbanBoardProps {
  data: UserData;
  onSaveData: (updatedData: UserData) => void;
  theme?: "luxo" | "claro" | "rubi";
}

type KanbanTask = {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  color?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const KANBAN_COLUMNS = [
  "A Fazer",
  "Em Andamento",
  "Aguardando",
  "Revisão",
  "Concluído",
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  theme = "luxo",
}) => {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [activeColFilter, setActiveColFilter] = useState<"all" | string>("all");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("media");
  const [initialStatus, setInitialStatus] = useState("A Fazer");
  const [color, setColor] = useState("#D4AF37");

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await api.getKanbanTasks();
      setTasks(response.tasks || []);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar tarefas do Kanban.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("media");
    setInitialStatus("A Fazer");
    setColor("#D4AF37");
  };

  const parseLocalDate = (dateStr?: string | null) => {
    if (!dateStr) return null;

    const datePart = dateStr.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);

    return new Date(year, (month || 1) - 1, day || 1);
  };

  const formatDate = (dateStr?: string | null) => {
    const date = parseLocalDate(dateStr);

    if (!date) return "Sem prazo";

    return date.toLocaleDateString("pt-BR");
  };

  const isOverdue = (dateStr?: string | null, status?: string) => {
    const date = parseLocalDate(dateStr);

    if (!date || status === "Concluído") return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return date.getTime() < today.getTime();
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Informe o título da tarefa.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.createKanbanTask({
        title: title.trim(),
        description,
        dueDate,
        priority,
        status: initialStatus,
        color,
      });

      setTasks((prev) => [response.task, ...prev]);

      resetForm();
      setShowAddCardModal(false);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao criar tarefa.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (task: KanbanTask) => {
    const confirmed = window.confirm(
      `Deseja realmente excluir a tarefa "${task.title}"?`
    );

    if (!confirmed) return;

    try {
      await api.deleteKanbanTask(task.id);
      setTasks((prev) => prev.filter((item) => item.id !== task.id));
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao excluir tarefa.");
    }
  };

  const handleShiftTask = async (task: KanbanTask, direction: "left" | "right") => {
    const currentIndex = KANBAN_COLUMNS.indexOf(task.status);

    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    if (direction === "left" && currentIndex > 0) {
      nextIndex--;
    }

    if (direction === "right" && currentIndex < KANBAN_COLUMNS.length - 1) {
      nextIndex++;
    }

    if (nextIndex === currentIndex) return;

    const nextStatus = KANBAN_COLUMNS[nextIndex];

    try {
      const response = await api.updateKanbanTask(task.id, {
        status: nextStatus,
      });

      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? response.task : item))
      );
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao mover tarefa.");
    }
  };

  const handleChangePriority = async (task: KanbanTask, nextPriority: string) => {
    try {
      const response = await api.updateKanbanTask(task.id, {
        priority: nextPriority,
      });

      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? response.task : item))
      );
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao alterar prioridade.");
    }
  };

  const allVisibleTasks =
    activeColFilter === "all"
      ? tasks
      : tasks.filter((task) => task.status === activeColFilter);

  const urgentCount = tasks.filter(
    (task) => task.priority === "alta" && task.status !== "Concluído"
  ).length;

  const overdueCount = tasks.filter((task) =>
    isOverdue(task.dueDate, task.status)
  ).length;

  const doneCount = tasks.filter((task) => task.status === "Concluído").length;

  const columnBg =
    theme === "luxo"
      ? "bg-neutral-900/25 border border-neutral-800/40 rounded-xl p-4 flex flex-col lg:min-h-[600px] min-h-[120px]"
      : theme === "claro"
      ? "bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col lg:min-h-[600px] min-h-[120px]"
      : "bg-stone-900/60 border border-stone-800/50 rounded-xl p-4 flex flex-col lg:min-h-[600px] min-h-[120px]";

  const cardBg =
    theme === "luxo"
      ? "bg-neutral-900 border border-neutral-800/80 rounded-lg p-3.5 shadow-md space-y-3 relative group hover:border-amber-500/20 transition-all"
      : theme === "claro"
      ? "bg-white border border-stone-200 rounded-lg p-3.5 shadow-sm space-y-3 relative group"
      : "bg-stone-900 border border-stone-800 rounded-lg p-3.5 shadow-md space-y-3 relative group";

  const textPrimary = theme === "claro" ? "text-stone-900" : "text-white";
  const textSecondary = theme === "claro" ? "text-stone-500" : "text-neutral-400";

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

  const getPriorityClass = (priority: string) => {
    if (priority === "alta") return "text-red-400 bg-red-500/10 border-red-500/20";
    if (priority === "media")
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-neutral-400 bg-neutral-500/10 border-neutral-500/20";
  };

  const getStatusColor = (status: string) => {
    if (status === "Concluído") return "text-emerald-400";
    if (status === "Revisão") return "text-blue-400";
    if (status === "Aguardando") return "text-red-400";
    if (status === "Em Andamento") return "text-amber-400";
    return "text-neutral-400";
  };

  return (
    <div className="space-y-6" id="kanban-module">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className={`text-[10px] uppercase tracking-widest font-semibold ${textAccent}`}>
            Quadro Operacional
          </span>

          <h1 className={`text-2xl font-serif font-light mt-1 ${textPrimary}`}>
            Kanban de Tarefas
          </h1>

          <p className="text-xs text-neutral-500">
            Tarefas salvas no PostgreSQL, organizadas por fluxo de trabalho.
          </p>
        </div>

        <button
          onClick={() => setShowAddCardModal(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer font-medium ${buttonPrimary}`}
        >
          <Plus size={14} />
          Nova Tarefa
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-neutral-900/25 border border-neutral-800/40 rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-widest text-neutral-500">
            Tarefas Ativas
          </span>
          <h3 className={`text-2xl font-mono mt-1 ${textPrimary}`}>
            {tasks.filter((task) => task.status !== "Concluído").length}
          </h3>
        </div>

        <div className="bg-neutral-900/25 border border-neutral-800/40 rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-widest text-neutral-500">
            Prioridade Alta
          </span>
          <h3 className="text-2xl font-mono mt-1 text-red-400">
            {urgentCount}
          </h3>
        </div>

        <div className="bg-neutral-900/25 border border-neutral-800/40 rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-widest text-neutral-500">
            Concluídas
          </span>
          <h3 className="text-2xl font-mono mt-1 text-emerald-400">
            {doneCount}
          </h3>
        </div>
      </div>

      {overdueCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertTriangle size={15} />
          Existem {overdueCount} tarefa(s) atrasada(s).
        </div>
      )}

      <div className="lg:hidden flex overflow-x-auto scrollbar-none gap-1.5 pb-2 -mx-4 px-4 whitespace-nowrap">
        <button
          onClick={() => setActiveColFilter("all")}
          className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-semibold transition-all cursor-pointer ${
            activeColFilter === "all"
              ? "bg-amber-500 text-neutral-950 font-bold"
              : "bg-neutral-900 text-neutral-400 border border-neutral-800/40"
          }`}
        >
          Todos ({tasks.length})
        </button>

        {KANBAN_COLUMNS.map((col) => {
          const count = tasks.filter((task) => task.status === col).length;

          return (
            <button
              key={col}
              onClick={() => setActiveColFilter(col)}
              className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                activeColFilter === col
                  ? "bg-amber-500 text-neutral-950 font-bold"
                  : "bg-neutral-900 text-neutral-400 border border-neutral-800/40"
              }`}
            >
              {col} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-16 border border-dashed border-neutral-800 rounded-2xl text-center text-xs text-neutral-500">
          <Loader2 className="mx-auto animate-spin text-amber-400 mb-3" size={28} />
          Carregando tarefas do banco...
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-16 border border-dashed border-neutral-800 rounded-2xl text-center space-y-3">
          <CheckSquare className="mx-auto text-neutral-600" size={34} />
          <h3 className={`text-sm font-medium ${textPrimary}`}>
            Nenhuma tarefa no Kanban
          </h3>
          <p className="text-xs text-neutral-500">
            Crie sua primeira tarefa para organizar o fluxo da operação.
          </p>
        </div>
      ) : (
        <div
          className="flex flex-col lg:flex-row gap-4 lg:overflow-x-auto pb-4 scrollbar-thin select-none"
          id="kanban-board-container"
        >
          {KANBAN_COLUMNS.filter(
            (col) => activeColFilter === "all" || col === activeColFilter
          ).map((colName) => {
            const colCards = allVisibleTasks.filter(
              (task) => task.status === colName
            );

            return (
              <div
                key={colName}
                className={`w-full lg:min-w-[320px] lg:w-80 flex-shrink-0 ${columnBg}`}
              >
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-neutral-800/30">
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider ${getStatusColor(
                      colName
                    )}`}
                  >
                    {colName}
                  </span>

                  <span className="text-[10px] font-mono px-2 py-0.5 bg-neutral-950/80 text-neutral-400 rounded-full font-bold">
                    {colCards.length}
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 max-h-[600px] pr-1">
                  {colCards.map((task) => {
                    const overdue = isOverdue(task.dueDate, task.status);

                    return (
                      <div key={task.id} className={cardBg}>
                        <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest">
                          <span
                            className={`px-2 py-0.5 rounded font-bold border ${getPriorityClass(
                              task.priority
                            )}`}
                          >
                            {task.priority || "media"}
                          </span>

                          {overdue && (
                            <span className="px-2 py-0.5 rounded font-bold text-red-400 bg-red-500/10 border border-red-500/20">
                              atrasada
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between items-start gap-1">
                          <h4 className={`text-xs font-semibold ${textPrimary} flex-1`}>
                            {task.title}
                          </h4>

                          <button
                            onClick={() => handleDeleteTask(task)}
                            className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Excluir tarefa"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>

                        <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                          {task.description || "Sem descrição"}
                        </p>

                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-neutral-500 pt-2 border-t border-neutral-800/40">
                          <Clock size={10} />
                          <span>Prazo: {formatDate(task.dueDate)}</span>
                        </div>

                        <select
                          value={task.priority || "media"}
                          onChange={(e) => handleChangePriority(task, e.target.value)}
                          className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-[10px] text-neutral-300 cursor-pointer"
                        >
                          <option value="alta">Alta</option>
                          <option value="media">Média</option>
                          <option value="baixa">Baixa</option>
                        </select>

                        <div className="flex justify-between items-center pt-1.5">
                          <button
                            onClick={() => handleShiftTask(task, "left")}
                            disabled={KANBAN_COLUMNS.indexOf(task.status) === 0}
                            className="p-1 rounded bg-neutral-950 text-neutral-500 hover:text-amber-400 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <ArrowLeft size={12} />
                          </button>

                          <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-mono">
                            Mover
                          </span>

                          <button
                            onClick={() => handleShiftTask(task, "right")}
                            disabled={
                              KANBAN_COLUMNS.indexOf(task.status) ===
                              KANBAN_COLUMNS.length - 1
                            }
                            className="p-1 rounded bg-neutral-950 text-neutral-500 hover:text-amber-400 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {colCards.length === 0 && (
                    <div className="p-8 text-center text-[10px] text-neutral-600 border border-dashed border-neutral-800/40 rounded-lg">
                      Coluna vazia.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-neutral-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-serif font-light tracking-wider">
                Nova Tarefa Kanban
              </h3>

              <button
                onClick={() => {
                  resetForm();
                  setShowAddCardModal(false);
                }}
                className="text-neutral-500 hover:text-neutral-300"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                  Título da Tarefa *
                </label>

                <input
                  type="text"
                  required
                  placeholder="Ex: Separar joias para entrega"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                  Descrição
                </label>

                <textarea
                  rows={2}
                  placeholder="Detalhes da tarefa..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Prazo
                  </label>

                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Prioridade
                  </label>

                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100 cursor-pointer font-medium"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                  Coluna Inicial
                </label>

                <select
                  value={initialStatus}
                  onChange={(e) => setInitialStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100 cursor-pointer"
                >
                  {KANBAN_COLUMNS.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                  Cor do Cartão
                </label>

                <div className="flex gap-2 items-center h-9">
                  {["#D4AF37", "#E11D48", "#3B82F6", "#10B981"].map((cardColor) => (
                    <button
                      key={cardColor}
                      type="button"
                      onClick={() => setColor(cardColor)}
                      className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                        color === cardColor ? "scale-125 border-white" : "border-transparent"
                      }`}
                      style={{ backgroundColor: cardColor }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-neutral-950 font-bold uppercase tracking-widest rounded-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Salvando..." : "Inserir no Kanban"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};