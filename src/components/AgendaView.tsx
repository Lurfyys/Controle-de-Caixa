/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  MapPin,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  CalendarDays,
  Bookmark,
} from "lucide-react";
import { UserData } from "../lib/store";
import { api } from "../services/api";

interface AgendaViewProps {
  data: UserData;
  onSaveData: (updatedData: UserData) => void;
  theme?: "luxo" | "claro" | "rubi";
}

type CalendarEvent = {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  date: string;
  time?: string | null;
  location?: string | null;
  priority: "alta" | "media" | "baixa" | string;
  status: "pendente" | "concluido" | string;
  color?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export const AgendaView: React.FC<AgendaViewProps> = ({
  theme = "luxo",
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeView, setActiveView] = useState<"mes" | "lista">("mes");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState<"alta" | "media" | "baixa">("media");
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState("#D4AF37");

  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await api.getCalendarEvents();
      setEvents(response.events || []);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar agenda.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setTime("");
    setLocation("");
    setPriority("media");
    setNotes("");
    setColor("#D4AF37");
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

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !date) return;

    try {
      setSaving(true);

      const response = await api.createCalendarEvent({
        title,
        description,
        date,
        time,
        location,
        priority,
        status: "pendente",
        color,
        notes,
      });

      setEvents((prev) => [...prev, response.event]);

      resetForm();
      setShowAddEventModal(false);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao criar evento.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEventStatus = async (event: CalendarEvent) => {
    const nextStatus = event.status === "pendente" ? "concluido" : "pendente";

    try {
      const response = await api.updateCalendarEvent(event.id, {
        status: nextStatus,
      });

      setEvents((prev) =>
        prev.map((evt) => (evt.id === event.id ? response.event : evt))
      );

      setSelectedDayEvents((prev) =>
        prev.map((evt) => (evt.id === event.id ? response.event : evt))
      );
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao atualizar evento.");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const confirmed = window.confirm("Deseja realmente excluir este evento?");

    if (!confirmed) return;

    try {
      await api.deleteCalendarEvent(id);

      setEvents((prev) => prev.filter((evt) => evt.id !== id));
      setSelectedDayEvents((prev) => prev.filter((evt) => evt.id !== id));
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao excluir evento.");
    }
  };

  const getDaysInMonth = (dateObj: Date) => {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const daysArr: (Date | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      daysArr.push(null);
    }

    for (let i = 1; i <= totalDays; i++) {
      daysArr.push(new Date(year, month, i));
    }

    return daysArr;
  };

  const daysGrid = getDaysInMonth(currentDate);

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const getEventsForDate = (dateObj: Date) => {
    const compareStr = formatDateToInput(dateObj);
    return events.filter((evt) => evt.date.split("T")[0] === compareStr);
  };

  const sortedEvents = [...events].sort((a, b) => {
    const dateA = parseLocalDate(a.date).getTime();
    const dateB = parseLocalDate(b.date).getTime();

    if (dateA !== dateB) return dateA - dateB;

    return String(a.time || "").localeCompare(String(b.time || ""));
  });

  const cardBg =
    theme === "luxo"
      ? "bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 shadow-lg backdrop-blur-md"
      : theme === "claro"
      ? "bg-white border border-stone-200 rounded-xl p-5 shadow-sm"
      : "bg-stone-900/90 border border-stone-800 rounded-xl p-5 shadow-lg";

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

  return (
    <div className="space-y-6" id="agenda-module">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className={`text-[10px] uppercase tracking-widest font-semibold ${textAccent}`}>
            Compromissos & Entregas
          </span>
          <h1 className={`text-2xl font-serif font-light mt-1 ${textPrimary}`}>
            Agenda Integrada
          </h1>
          <p className="text-xs text-neutral-500">
            Eventos salvos no PostgreSQL via backend.
          </p>
        </div>

        <button
          onClick={() => {
            setDate(new Date().toISOString().split("T")[0]);
            setShowAddEventModal(true);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer font-medium ${buttonPrimary}`}
        >
          <Plus size={14} />
          Agendar Evento
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-neutral-900/10 p-4 rounded-xl border border-neutral-800/40">
        {activeView === "mes" ? (
          <div className="flex items-center gap-4 text-xs font-serif font-light">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            <span className={`text-base tracking-widest uppercase ${textPrimary}`}>
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CalendarDays
              size={18}
              className={theme === "luxo" ? "text-amber-400" : "text-neutral-300"}
            />
            <span className={`text-sm tracking-wider uppercase ${textPrimary}`}>
              Linha do Tempo
            </span>
          </div>
        )}

        <div className="flex gap-1 bg-neutral-950 p-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider">
          {(["mes", "lista"] as const).map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-4 py-2 rounded-md transition-all cursor-pointer ${
                activeView === view
                  ? theme === "luxo"
                    ? "bg-neutral-900 text-amber-400"
                    : "bg-stone-800 text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {view === "mes" ? "Visualizar Mês" : "Lista Completa"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-16 border border-dashed border-neutral-800 rounded-2xl text-center text-xs text-neutral-500">
          <Loader2 className="mx-auto animate-spin text-amber-400 mb-3" size={28} />
          Carregando agenda do banco...
        </div>
      ) : activeView === "mes" ? (
        <div className={`${cardBg} overflow-hidden`} id="agenda-calendar-grid">
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase tracking-widest font-semibold pb-3 text-neutral-500 border-b border-neutral-800/40">
            {weekdays.map((weekday) => (
              <div key={weekday}>{weekday}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 mt-4">
            {daysGrid.map((day, idx) => {
              if (!day) {
                return (
                  <div
                    key={idx}
                    className="h-20 bg-neutral-950/10 rounded-lg"
                  />
                );
              }

              const dayEvents = getEventsForDate(day);
              const isToday = new Date().toDateString() === day.toDateString();

              return (
                <div
                  key={idx}
                  className={`h-24 p-2 rounded-lg flex flex-col justify-between border group transition-all relative cursor-pointer ${
                    isToday
                      ? theme === "luxo"
                        ? "border-amber-500/50 bg-amber-500/5"
                        : "border-stone-900 bg-stone-50"
                      : theme === "luxo"
                      ? "border-neutral-800/50 bg-neutral-950/20 hover:border-neutral-700"
                      : "border-stone-200 bg-stone-50 hover:border-stone-300"
                  }`}
                  onClick={() => {
                    if (dayEvents.length > 0) {
                      setSelectedDayEvents(dayEvents);
                    } else {
                      setDate(formatDateToInput(day));
                      setShowAddEventModal(true);
                    }
                  }}
                >
                  <span
                    className={`text-[11px] font-mono font-semibold ${
                      isToday ? "text-amber-400" : textSecondary
                    }`}
                  >
                    {day.getDate()}
                  </span>

                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((evt) => (
                      <div
                        key={evt.id}
                        className="text-[9px] truncate px-1.5 py-0.5 rounded font-medium flex items-center gap-1"
                        style={{
                          backgroundColor: `${evt.color || "#D4AF37"}15`,
                          color: evt.color || "#D4AF37",
                          border: `1px solid ${evt.color || "#D4AF37"}30`,
                        }}
                        title={evt.title}
                      >
                        <div
                          className="w-1 h-1 rounded-full flex-shrink-0"
                          style={{ backgroundColor: evt.color || "#D4AF37" }}
                        />
                        <span className="truncate">{evt.title}</span>
                      </div>
                    ))}

                    {dayEvents.length > 2 && (
                      <span className="text-[8px] text-neutral-500 block text-right">
                        +{dayEvents.length - 2} mais
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : sortedEvents.length === 0 ? (
        <div className="p-16 border border-dashed border-neutral-800 rounded-2xl text-center text-xs text-neutral-500">
          Nenhum compromisso ou lembrete planejado na agenda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="agenda-list-grid">
          {sortedEvents.map((evt) => (
            <div
              key={evt.id}
              className={`${cardBg} flex gap-4 relative overflow-hidden group border-l-4`}
              style={{ borderLeftColor: evt.color || "#D4AF37" }}
            >
              <div className="flex-1 space-y-3">
                <div>
                  <span className="text-[10px] text-neutral-500 font-mono block">
                    {parseLocalDate(evt.date).toLocaleDateString("pt-BR")}
                    {evt.time && ` • às ${evt.time}`}
                  </span>

                  <h3
                    className={`text-sm font-medium mt-1 ${
                      evt.status === "concluido"
                        ? "line-through text-neutral-500"
                        : textPrimary
                    }`}
                  >
                    {evt.title}
                  </h3>

                  <p className="text-xs text-neutral-400 mt-1">
                    {evt.description || "Sem descrição"}
                  </p>
                </div>

                <div className="flex gap-4 text-[10px] font-mono text-neutral-500">
                  {evt.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />
                      {evt.location}
                    </span>
                  )}

                  <span className="flex items-center gap-1 capitalize">
                    <Bookmark size={11} style={{ color: evt.color || "#D4AF37" }} />
                    Prioridade {evt.priority}
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-between items-end">
                <button
                  onClick={() => handleDeleteEvent(evt.id)}
                  className="text-neutral-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Excluir Evento"
                >
                  <X size={14} />
                </button>

                <button
                  onClick={() => handleToggleEventStatus(evt)}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    evt.status === "concluido"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-amber-500/40"
                  }`}
                  title={
                    evt.status === "concluido"
                      ? "Reabrir Evento"
                      : "Marcar Concluído"
                  }
                >
                  <CheckCircle2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDayEvents.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-neutral-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400">
                Compromissos do Dia
              </h3>

              <button
                onClick={() => setSelectedDayEvents([])}
                className="text-neutral-500 hover:text-neutral-300"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {selectedDayEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-xs space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {evt.time || "Sem horário"}
                    </span>

                    <button
                      onClick={() => handleToggleEventStatus(evt)}
                      className={`text-[9px] uppercase px-2 py-0.5 rounded font-semibold ${
                        evt.status === "concluido"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      {evt.status}
                    </button>
                  </div>

                  <h4 className="font-semibold text-neutral-200">{evt.title}</h4>

                  <p className="text-neutral-400 text-[11px]">
                    {evt.description || "Sem descrição"}
                  </p>

                  <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
                    <span className="text-[10px] text-neutral-500">
                      {evt.location || "Sem local"}
                    </span>

                    <button
                      onClick={() => handleDeleteEvent(evt.id)}
                      className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => {
                  const firstEvent = selectedDayEvents[0];
                  setDate(firstEvent.date.split("T")[0]);
                  setSelectedDayEvents([]);
                  setShowAddEventModal(true);
                }}
                className="w-full py-2 rounded-lg border border-neutral-800 text-neutral-400 text-xs hover:border-amber-500/30 hover:text-amber-400 transition-all"
              >
                Adicionar outro evento nesse dia
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-neutral-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-serif font-light tracking-wider">
                Agendar Compromisso / Entrega
              </h3>

              <button
                onClick={() => {
                  resetForm();
                  setShowAddEventModal(false);
                }}
                className="text-neutral-500 hover:text-neutral-300"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                  Título do Agendamento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Entrega das alianças de Sr. Bruno"
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
                  placeholder="Ex: Aliança polida, embalagem veludo vermelha..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Local
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Showroom"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as "alta" | "media" | "baixa")
                    }
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
                  Marcador de Cor
                </label>

                <div className="flex gap-2 items-center h-9">
                  {["#D4AF37", "#E11D48", "#3B82F6", "#10B981"].map((eventColor) => (
                    <button
                      key={eventColor}
                      type="button"
                      onClick={() => setColor(eventColor)}
                      className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                        color === eventColor
                          ? "scale-125 border-white"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: eventColor }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  placeholder="Informações extras do cliente, entrega ou serviço..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-neutral-950 font-bold uppercase tracking-widest rounded-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Salvando..." : "Vincular à Agenda"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};