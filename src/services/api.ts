/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const API_URL = "http://localhost:3001";

// ==========================================
// TIPOS (TYPES)
// ==========================================

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  name: string;
  email: string;
  password: string;
  companyName?: string;
};

type InventoryData = {
  name: string;
  category: string;
  weight: number;
  goldType: string;
  gem: string;
  costPrice: number;
  sellPrice: number;
  quantity?: number;
  status: string;
  description?: string;
  imageUrl?: string;
};

type CashData = {
  type: string;
  category: string;
  subcategory?: string;
  amount: number;
  description?: string;
  date?: string;
};

type CalendarData = {
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  priority?: string;
  status?: string;
  color?: string;
  notes?: string;
};

type KanbanData = {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  color?: string;
};

type NoteData = {
  title: string;
  content?: string;
  color?: string;
  imageUrl?: string;
  tags?: string[];
  isPinned?: boolean;
  checklist?: any[];
};

// ==========================================
// FUNÇÃO BASE
// ==========================================

async function request(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("blackstone_token");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro na requisição.");
  }

  return data;
}

// ==========================================
// API
// ==========================================

export const api = {
  // ===================================================
  // AUTH
  // ===================================================

  async register(data: RegisterData) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async login(data: LoginData) {
    const response = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.token) {
      localStorage.setItem("blackstone_token", response.token);
    }

    return response;
  },

  async me() {
    return request("/auth/me");
  },

  logout() {
    localStorage.removeItem("blackstone_token");
  },

  // ===================================================
  // INVENTÁRIO
  // ===================================================

  async getInventory() {
    return request("/inventory");
  },

  async createInventory(data: InventoryData) {
    return request("/inventory", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateInventory(id: string, data: Partial<InventoryData>) {
    return request(`/inventory/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteInventory(id: string) {
    return request(`/inventory/${id}`, {
      method: "DELETE",
    });
  },

  // ===================================================
  // UPLOAD INVENTÁRIO
  // ===================================================

  async uploadInventoryImage(file: File) {
    const token = localStorage.getItem("blackstone_token");

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_URL}/upload/inventory`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const text = await response.text();

    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      console.error(text);
      throw new Error("Erro interno do servidor.");
    }

    if (!response.ok) {
      throw new Error(data.message || "Erro ao enviar imagem.");
    }

    return data;
  },

  // ===================================================
  // CAIXA
  // ===================================================

  async getCash() {
    return request("/cash");
  },

  async createCash(data: CashData) {
    return request("/cash", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateCash(id: string, data: Partial<CashData>) {
    return request(`/cash/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteCash(id: string) {
    return request(`/cash/${id}`, {
      method: "DELETE",
    });
  },

  // ===================================================
  // AGENDA
  // ===================================================

  async getCalendarEvents() {
    return request("/calendar");
  },

  async createCalendarEvent(data: CalendarData) {
    return request("/calendar", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateCalendarEvent(
    id: string,
    data: Partial<CalendarData>
  ) {
    return request(`/calendar/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteCalendarEvent(id: string) {
    return request(`/calendar/${id}`, {
      method: "DELETE",
    });
  },

  // ===================================================
  // KANBAN
  // ===================================================

  async getKanbanTasks() {
    return request("/kanban");
  },

  async createKanbanTask(data: KanbanData) {
    return request("/kanban", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateKanbanTask(
    id: string,
    data: Partial<KanbanData>
  ) {
    return request(`/kanban/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteKanbanTask(id: string) {
    return request(`/kanban/${id}`, {
      method: "DELETE",
    });
  },

  // ===================================================
  // NOTAS
  // ===================================================

  async getNotes() {
    return request("/notes");
  },

  async createNote(data: NoteData) {
    return request("/notes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateNote(id: string, data: Partial<NoteData>) {
    return request(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteNote(id: string) {
    return request(`/notes/${id}`, {
      method: "DELETE",
    });
  },
};

export { API_URL };