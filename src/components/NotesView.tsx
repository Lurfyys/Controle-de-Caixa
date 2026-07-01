/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import {
  Plus,
  Bookmark,
  Trash2,
  CheckSquare,
  Square,
  Pin,
  X,
  Loader2,
} from "lucide-react";
import { UserData } from "../lib/store";
import { api } from "../services/api";

interface NotesProps {
  data: UserData;
  onSaveData: (updatedData: UserData) => void;
  theme?: "luxo" | "claro" | "rubi";
}

type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

type NoteItem = {
  id: string;
  userId: string;
  title: string;
  content?: string | null;
  color?: string | null;
  imageUrl?: string | null;
  tags: string[];
  isPinned: boolean;
  checklist?: ChecklistItem[] | null;
  createdAt: string;
  updatedAt?: string;
};

export const NotesView: React.FC<NotesProps> = ({ theme = "luxo" }) => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("all");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("gold");
  const [tagsInput, setTagsInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [checklistItems, setChecklistItems] = useState<{ text: string }[]>([]);
  const [newCheckItemText, setNewCheckItemText] = useState("");

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await api.getNotes();
      setNotes(response.notes || []);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar notas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setColor("gold");
    setTagsInput("");
    setImageUrl("");
    setChecklistItems([]);
    setNewCheckItemText("");
  };

  const handleAddChecklistItem = () => {
    if (!newCheckItemText.trim()) return;

    setChecklistItems((prev) => [...prev, { text: newCheckItemText.trim() }]);
    setNewCheckItemText("");
  };

  const handleRemoveCheckItem = (idx: number) => {
    setChecklistItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Informe o título da nota.");
      return;
    }

    const formattedChecklist: ChecklistItem[] = checklistItems.map((item, idx) => ({
      id: `check_${idx}_${Math.random().toString(36).slice(2, 8)}`,
      text: item.text,
      done: false,
    }));

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      setSaving(true);

      const response = await api.createNote({
        title: title.trim(),
        content,
        color,
        imageUrl,
        tags: tags.length > 0 ? tags : ["Geral"],
        isPinned: false,
        checklist: formattedChecklist,
      });

      setNotes((prev) => [response.note, ...prev]);

      resetForm();
      setShowAddModal(false);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao criar nota.");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePin = async (note: NoteItem) => {
    try {
      const response = await api.updateNote(note.id, {
        isPinned: !note.isPinned,
      });

      setNotes((prev) =>
        prev.map((item) => (item.id === note.id ? response.note : item))
      );
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao fixar nota.");
    }
  };

  const handleDeleteNote = async (note: NoteItem) => {
    const confirmed = window.confirm(`Deseja realmente excluir "${note.title}"?`);

    if (!confirmed) return;

    try {
      await api.deleteNote(note.id);
      setNotes((prev) => prev.filter((item) => item.id !== note.id));
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao excluir nota.");
    }
  };

  const handleToggleCheckItem = async (note: NoteItem, itemId: string) => {
    const currentChecklist = Array.isArray(note.checklist) ? note.checklist : [];

    const updatedChecklist = currentChecklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );

    try {
      const response = await api.updateNote(note.id, {
        checklist: updatedChecklist,
      });

      setNotes((prev) =>
        prev.map((item) => (item.id === note.id ? response.note : item))
      );
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao atualizar checklist.");
    }
  };

  const allUniqueTags = Array.from(new Set(notes.flatMap((note) => note.tags || [])));

  const filteredNotes = notes.filter((note) => {
    const search = searchQuery.toLowerCase();

    const matchesSearch =
      note.title.toLowerCase().includes(search) ||
      String(note.content || "").toLowerCase().includes(search);

    const matchesTag =
      selectedTagFilter === "all" || (note.tags || []).includes(selectedTagFilter);

    return matchesSearch && matchesTag;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    return new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime();
  });

  const getNoteColorClasses = (noteColor?: string | null) => {
    switch (noteColor) {
      case "gold":
        return "bg-amber-500/10 border-amber-500/20 text-amber-200";
      case "ruby":
        return "bg-red-500/10 border-red-500/20 text-red-200";
      case "charcoal":
        return "bg-neutral-900 border-neutral-800 text-neutral-200";
      case "cream":
        return "bg-stone-100 border-stone-200 text-stone-900";
      default:
        return "bg-neutral-900 border-neutral-800 text-neutral-200";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

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

  return (
    <div className="space-y-6" id="notes-module">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className={`text-[10px] uppercase tracking-widest font-semibold ${textAccent}`}>
            Ideias & Croquis
          </span>

          <h1 className={`text-2xl font-serif font-light mt-1 ${textPrimary}`}>
            Anotações de Atelier
          </h1>

          <p className="text-xs text-neutral-500">
            Notas, checklists e ideias salvas no PostgreSQL.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer font-medium ${buttonPrimary}`}
        >
          <Plus size={14} />
          Nova Nota
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-neutral-900/10 p-4 rounded-xl border border-neutral-800/40">
        <div className="flex-1 relative">
          <Square className="absolute left-3.5 top-3.5 text-neutral-500" size={14} />

          <input
            type="text"
            placeholder="Pesquisar em ideias, listas e anotações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-xs focus:outline-none focus:border-amber-500/50 transition-all ${
              theme === "luxo"
                ? "bg-neutral-950/40 border border-neutral-800 text-neutral-100"
                : "bg-white border border-stone-200 text-stone-900"
            }`}
          />
        </div>

        <div className="min-w-[150px]">
          <select
            value={selectedTagFilter}
            onChange={(e) => setSelectedTagFilter(e.target.value)}
            className={`w-full px-3 py-2.5 rounded-lg text-xs focus:outline-none cursor-pointer ${
              theme === "luxo"
                ? "bg-neutral-950/40 border border-neutral-800 text-neutral-100"
                : "bg-white border border-stone-200 text-stone-900"
            }`}
          >
            <option value="all">Todas as Tags</option>
            {allUniqueTags.map((tag) => (
              <option key={tag} value={tag} className="bg-neutral-900 text-neutral-100">
                {tag}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-16 border border-dashed border-neutral-800 rounded-2xl text-center text-xs text-neutral-500">
          <Loader2 className="mx-auto animate-spin text-amber-400 mb-3" size={28} />
          Carregando notas do banco...
        </div>
      ) : sortedNotes.length === 0 ? (
        <div className="p-16 border border-dashed border-neutral-800 rounded-2xl text-center space-y-3">
          <Bookmark className="mx-auto text-neutral-600 animate-pulse" size={32} />

          <h3 className={`text-sm font-medium ${textPrimary}`}>
            Nenhuma anotação encontrada
          </h3>

          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Clique acima para criar sua primeira nota, checklist ou ideia.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="notes-waterfall-grid">
          {sortedNotes.map((note) => {
            const checklist = Array.isArray(note.checklist) ? note.checklist : [];

            return (
              <div
                key={note.id}
                className={`border rounded-xl p-5 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between space-y-4 ${getNoteColorClasses(
                  note.color
                )}`}
              >
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-sm font-semibold tracking-wide leading-snug">
                      {note.title}
                    </h3>

                    <div className="flex gap-2 items-center flex-shrink-0">
                      <button
                        onClick={() => handleTogglePin(note)}
                        className={`p-1 rounded hover:bg-neutral-800/20 transition-all cursor-pointer ${
                          note.isPinned ? "text-amber-400" : "text-neutral-500"
                        }`}
                        title={note.isPinned ? "Desafixar nota" : "Fixar no topo"}
                      >
                        <Pin size={13} fill={note.isPinned ? "currentColor" : "none"} />
                      </button>

                      <button
                        onClick={() => handleDeleteNote(note)}
                        className="p-1 rounded hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-all cursor-pointer"
                        title="Excluir nota"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {note.imageUrl && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-neutral-800/30 bg-neutral-950/40">
                      <img
                        src={note.imageUrl}
                        alt={note.title}
                        className="w-full max-h-44 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  <p className="text-xs mt-3 leading-relaxed whitespace-pre-wrap opacity-85">
                    {note.content || "Sem conteúdo."}
                  </p>

                  {checklist.length > 0 && (
                    <div className="space-y-2 mt-4 pt-4 border-t border-neutral-800/20">
                      {checklist.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleCheckItem(note, item.id)}
                          className="flex items-center gap-2 text-xs opacity-85 hover:opacity-100 cursor-pointer"
                        >
                          {item.done ? (
                            <CheckSquare size={13} className="text-amber-400 flex-shrink-0" />
                          ) : (
                            <Square size={13} className="text-neutral-500 flex-shrink-0" />
                          )}

                          <span
                            className={`select-none ${
                              item.done ? "line-through opacity-50" : ""
                            }`}
                          >
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2 text-[9px] font-mono opacity-70">
                  <div className="flex flex-wrap gap-1">
                    {(note.tags || ["Geral"]).map((tag) => (
                      <span
                        key={tag}
                        className="bg-neutral-950/40 px-1.5 py-0.5 rounded border border-neutral-800/30"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <span>{formatDate(note.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-neutral-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-serif font-light tracking-wider">
                Nova Nota / Checklist
              </h3>

              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(false);
                }}
                className="text-neutral-500 hover:text-neutral-300"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                  Título da Nota *
                </label>

                <input
                  type="text"
                  required
                  placeholder="Ex: Proporções de Ouro Branco 18K"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                  Conteúdo
                </label>

                <textarea
                  rows={3}
                  placeholder="Digite sua anotação..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                  Checklist
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Comprar granalha"
                    value={newCheckItemText}
                    onChange={(e) => setNewCheckItemText(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-neutral-100"
                  />

                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-semibold cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>

                {checklistItems.length > 0 && (
                  <div className="mt-3.5 space-y-1 bg-neutral-950/40 p-2.5 rounded border border-neutral-800">
                    {checklistItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-[11px] text-neutral-300"
                      >
                        <span>• {item.text}</span>

                        <button
                          type="button"
                          onClick={() => handleRemoveCheckItem(idx)}
                          className="text-red-400 hover:underline cursor-pointer"
                        >
                          Excluir
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Tags
                  </label>

                  <input
                    type="text"
                    placeholder="Ex: Fórmulas, Oficina"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Cor do Card
                  </label>

                  <div className="flex gap-2 items-center h-9">
                    {[
                      { key: "gold", color: "#D4AF37" },
                      { key: "ruby", color: "#E11D48" },
                      { key: "charcoal", color: "#171717" },
                      { key: "cream", color: "#F5F5F4" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setColor(item.key)}
                        className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                          color === item.key ? "scale-125 border-white" : "border-transparent"
                        }`}
                        style={{ backgroundColor: item.color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                  Link de imagem
                </label>

                <input
                  type="url"
                  placeholder="https://site.com/imagem.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-neutral-950 font-bold uppercase tracking-widest rounded-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Salvando..." : "Salvar Nota"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};