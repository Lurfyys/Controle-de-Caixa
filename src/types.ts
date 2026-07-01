/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  name: string;
  companyName?: string;
  createdAt: string;
}

export type JewelryStatus = 'Disponível' | 'Reservada' | 'Vendida' | 'Em produção';

export type JewelryCategory = 'Anéis' | 'Pulseiras' | 'Correntes' | 'Pingentes' | 'Brincos' | 'Alianças' | 'Relógios' | 'Outros' | string;

export interface JewelryItem {
  id: string;
  userId: string;
  name: string;
  category: JewelryCategory;
  weight: number; // in grams
  goldType: string; // e.g. "Ouro 18K Amarelo", "Ouro 18K Branco", "Ouro 18K Rosé", "Prata 950"
  gem: string; // e.g. "Diamante 1ct", "Esmeralda", "Nenhuma"
  costPrice: number;
  sellPrice: number;
  notes: string;
  createdAt: string;
  status: JewelryStatus;
  imageUrl?: string;
}

export interface SoldItem {
  id: string;
  userId: string;
  jewelryId: string;
  name: string;
  category: JewelryCategory;
  costPrice: number;
  soldPrice: number;
  profit: number;
  paymentMethod: 'Cartão de Crédito' | 'Cartão de Débito' | 'PIX' | 'Dinheiro' | 'Transferência Bancária';
  discount: number;
  installments: number; // number of installments (1 for cash)
  commission: number;
  date: string;
  notes: string;
}

export type TransactionType = 'entrada' | 'saida';

export interface CashTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  category: string; // e.g., 'Venda', 'Conserto', 'Matéria-prima', 'Pró-labore'
  subcategory: string;
  amount: number;
  date: string;
  description: string;
  linkedType?: 'venda' | 'os' | 'retirada' | 'producao' | 'outros';
  linkedId?: string;
}

export type ProductionStatus = 'A fazer' | 'Em produção' | 'Aguardando material' | 'Polimento' | 'Finalização' | 'Pronta';

export interface ProductionOrder {
  id: string;
  userId: string;
  name: string;
  description: string;
  weight: number;
  rawMaterial: string; // gold, platinum, silver, etc.
  estimatedCost: number;
  finalCost: number;
  startDate: string;
  dueDate: string;
  status: ProductionStatus;
  notes: string;
  imageUrl?: string;
  goldType: string;
  gem: string;
}

export type OSStatus = 'Recebido' | 'Em análise' | 'Aguardando material' | 'Em execução' | 'Pronto' | 'Entregue';

export interface ServiceOrder {
  id: string;
  userId: string;
  title: string;
  description: string;
  priceCharged: number;
  cost: number;
  entryDate: string;
  dueDate: string;
  status: OSStatus;
  notes: string;
  imageUrl?: string;
}

export type EventPriority = 'baixa' | 'media' | 'alta';
export type EventStatus = 'pendente' | 'concluido';

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  location?: string;
  priority: EventPriority;
  status: EventStatus;
  color: string; // Hex color or class name
  notes: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface NoteItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  checklist: ChecklistItem[];
  color: string; // "gold" | "ruby" | "charcoal" | "cream"
  tags: string[];
  imageUrl?: string;
  isPinned: boolean;
  date: string;
}

export type AppTheme = 'luxo' | 'claro' | 'rubi';

export interface DashboardWidget {
  id: string;
  title: string;
  visible: boolean;
}

export interface AppSettings {
  theme: AppTheme;
  logoUrl?: string;
  companyName: string;
  document?: string;
  categories: string[];
  subcategories: Record<string, string[]>;
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD';
  currency: 'BRL' | 'USD' | 'EUR';
  dashboardWidgets: DashboardWidget[];
}

export interface KanbanCard {
  id: string;
  userId: string;
  type: 'producao' | 'os' | 'tarefa' | 'compromisso';
  sourceId: string; // ID of the production or OS or event
  name: string;
  description: string;
  dueDate: string;
  priority: EventPriority;
  notes: string;
  imageUrl?: string;
  status: string; // Kanban columns
}
