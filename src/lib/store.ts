/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  JewelryItem,
  SoldItem,
  CashTransaction,
  ProductionOrder,
  ServiceOrder,
  CalendarEvent,
  NoteItem,
  AppSettings,
  KanbanCard,
} from '../types';

// Storage keys
const USERS_KEY = 'blackstone_users';
const CURRENT_USER_KEY = 'blackstone_current_user';
const DATA_PREFIX = 'blackstone_data_';

// Security Questions for Password Recovery
export const SECURITY_QUESTIONS = [
  'Qual o nome do seu primeiro animal de estimação?',
  'Qual a cidade onde você nasceu?',
  'Qual a marca do seu primeiro relógio ou joia?',
  'Qual o nome da sua primeira joalheria/oficina?',
];

interface UserRegistry {
  id: string;
  email: string;
  name: string;
  companyName: string;
  passwordHash: string; // Simple hash/storage for demo
  securityQuestion: string;
  securityAnswer: string;
}

export interface UserData {
  inventory: JewelryItem[];
  sold: SoldItem[];
  cash: CashTransaction[];
  production: ProductionOrder[];
  services: ServiceOrder[];
  agenda: CalendarEvent[];
  kanban: KanbanCard[];
  notes: NoteItem[];
  settings: AppSettings;
}

export const DefaultCategories = ['Anéis', 'Pulseiras', 'Correntes', 'Pingentes', 'Brincos', 'Alianças', 'Relógios', 'Outros'];

// Default settings for new users
export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'luxo',
  companyName: 'Blackstone Diamond',
  logoUrl: '',
  document: '12.345.678/0001-90',
  categories: DefaultCategories,
  subcategories: {
    'Oficina': ['Matéria-prima', 'Insumos', 'Ferramentas', 'Máquinas', 'Outros'],
    'Material da Loja': ['Limpeza', 'Obra', 'Escritório', 'Embalagens', 'Outros'],
    'Pessoal': ['Pró-labore', 'Retirada de lucro', 'Outros'],
    'Despesas Fixas': ['Água', 'Energia', 'Internet', 'Aluguel', 'Folha de pagamento', 'Contador', 'Outros'],
  },
  dateFormat: 'DD/MM/YYYY',
  currency: 'BRL',
  dashboardWidgets: [
    { id: 'balance', title: 'Saldo do Caixa', visible: true },
    { id: 'inventory', title: 'Valor de Estoque', visible: true },
    { id: 'revenue', title: 'Receita & Despesas', visible: true },
    { id: 'cashflow_chart', title: 'Gráfico de Fluxo de Caixa', visible: true },
    { id: 'productions', title: 'Produções em Andamento', visible: true },
    { id: 'agenda', title: 'Agenda do Dia', visible: true },
    { id: 'kanban', title: 'Tarefas Kanban', visible: true },
    { id: 'notes', title: 'Notas Fixadas', visible: true },
  ],
};

// Generates stunning mock data for the DEMO account
export const generateDemoData = (userId: string): UserData => {
  const now = new Date();
  const formatOffsetDate = (days: number) => {
    const d = new Date();
    d.setDate(now.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const inventory: JewelryItem[] = [
    {
      id: 'inv_1',
      userId,
      name: 'Anel Solitário Crown Diamond',
      category: 'Anéis',
      weight: 4.8,
      goldType: 'Ouro 18K Branco',
      gem: 'Diamante 1.5ct Lapidação Brilhante',
      costPrice: 4500,
      sellPrice: 12800,
      notes: 'Peça exclusiva da coleção de noivado. Possui 1 brilhante central e 12 microbrilhantes cravejados na haste.',
      createdAt: formatOffsetDate(-30),
      status: 'Disponível',
      imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'inv_2',
      userId,
      name: 'Gargantilha Elos Cartier Gold',
      category: 'Correntes',
      weight: 18.5,
      goldType: 'Ouro 18K Amarelo',
      gem: 'Nenhuma',
      costPrice: 6200,
      sellPrice: 15400,
      notes: 'Design moderno de elos ovais planos polidos à mão. Fecho gaveta duplo de extrema segurança.',
      createdAt: formatOffsetDate(-25),
      status: 'Disponível',
      imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'inv_3',
      userId,
      name: 'Brincos Cascade Esmeralda Real',
      category: 'Brincos',
      weight: 9.2,
      goldType: 'Ouro 18K Amarelo',
      gem: '2 Esmeraldas Colombianas 1ct e 24 Diamantes',
      costPrice: 8900,
      sellPrice: 24500,
      notes: 'Esmeraldas selecionadas com excelente cor e pureza. Lapidação gota.',
      createdAt: formatOffsetDate(-15),
      status: 'Reservada',
      imageUrl: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'inv_4',
      userId,
      name: 'Aliança Eternity Diamond Band',
      category: 'Alianças',
      weight: 6.0,
      goldType: 'Ouro 18K Rosé',
      gem: '28 Diamantes Lapidação Baguete',
      costPrice: 3800,
      sellPrice: 9900,
      notes: 'Cravação trilho contínua ao redor de toda a circunferência da aliança.',
      createdAt: formatOffsetDate(-10),
      status: 'Disponível',
      imageUrl: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const sold: SoldItem[] = [
    {
      id: 'sold_1',
      userId,
      jewelryId: 'inv_old_1',
      name: 'Bracelete Ouro Canelado Vintage',
      category: 'Pulseiras',
      costPrice: 3500,
      soldPrice: 8900,
      profit: 5400,
      paymentMethod: 'PIX',
      discount: 0,
      installments: 1,
      commission: 445,
      date: formatOffsetDate(-5),
      notes: 'Vendido para cliente VIP Dra. Helena. Sem descontos adicionais.',
    },
    {
      id: 'sold_2',
      userId,
      jewelryId: 'inv_old_2',
      name: 'Pingente Medalha São Bento Cravejada',
      category: 'Pingentes',
      costPrice: 1200,
      soldPrice: 3400,
      profit: 2200,
      paymentMethod: 'Cartão de Crédito',
      discount: 200,
      installments: 3,
      commission: 170,
      date: formatOffsetDate(-12),
      notes: 'Desconto especial de R$ 200 concedido no checkout para pagamento parcelado em 3x.',
    },
  ];

  const cash: CashTransaction[] = [
    // Income from Sales
    {
      id: 'tx_1',
      userId,
      type: 'entrada',
      category: 'Venda de joias',
      subcategory: 'Anéis',
      amount: 8900,
      date: formatOffsetDate(-5),
      description: 'Venda: Bracelete Ouro Canelado Vintage',
      linkedType: 'venda',
      linkedId: 'sold_1',
    },
    {
      id: 'tx_2',
      userId,
      type: 'entrada',
      category: 'Venda de joias',
      subcategory: 'Pingentes',
      amount: 3200, // soldPrice 3400 minus 200 discount
      date: formatOffsetDate(-12),
      description: 'Venda: Pingente Medalha São Bento Cravejada',
      linkedType: 'venda',
      linkedId: 'sold_2',
    },
    // Income from OS (Service orders)
    {
      id: 'tx_3',
      userId,
      type: 'entrada',
      category: 'Consertos',
      subcategory: 'Ajuste de aliança',
      amount: 450,
      date: formatOffsetDate(-3),
      description: 'OS Concluída: Ajuste de aliança solitário Platina',
      linkedType: 'os',
      linkedId: 'os_1',
    },
    {
      id: 'tx_4',
      userId,
      type: 'entrada',
      category: 'Serviços',
      subcategory: 'Banho de ouro',
      amount: 850,
      date: formatOffsetDate(-8),
      description: 'OS Concluída: Banho de Ouro 18k em 3 correntes antigas',
      linkedType: 'os',
      linkedId: 'os_2',
    },
    // Outflows (Expenses)
    {
      id: 'tx_5',
      userId,
      type: 'saida',
      category: 'Oficina',
      subcategory: 'Matéria-prima',
      amount: 2500,
      date: formatOffsetDate(-20),
      description: 'Compra de 10g de granalha de ouro 24k para fundição',
      linkedType: 'outros',
    },
    {
      id: 'tx_6',
      userId,
      type: 'saida',
      category: 'Despesas Fixas',
      subcategory: 'Aluguel',
      amount: 3000,
      date: formatOffsetDate(-1),
      description: 'Aluguel do Atelier de Alta Joalheria',
      linkedType: 'outros',
    },
    {
      id: 'tx_7',
      userId,
      type: 'saida',
      category: 'Material da Loja',
      subcategory: 'Embalagens',
      amount: 1200,
      date: formatOffsetDate(-10),
      description: 'Lote de 50 caixas de veludo premium com logo em relevo dourado',
      linkedType: 'outros',
    },
    {
      id: 'tx_8',
      userId,
      type: 'saida',
      category: 'Pessoal',
      subcategory: 'Pró-labore',
      amount: 4000,
      date: formatOffsetDate(-2),
      description: 'Retirada mensal padrão de Pró-labore do proprietário',
      linkedType: 'retirada',
    },
  ];

  const production: ProductionOrder[] = [
    {
      id: 'prod_1',
      userId,
      name: 'Anel de Formatura Medicina em Ouro Amarelo',
      description: 'Anel robusto de formatura com Esmeralda oval central e emblemas de serpente cravejados em ouro branco nas laterais.',
      weight: 12.5,
      rawMaterial: 'Ouro 24K (Smelted) + Liga Especial + Esmeralda',
      estimatedCost: 3200,
      finalCost: 3150,
      startDate: formatOffsetDate(-12),
      dueDate: formatOffsetDate(5),
      status: 'Polimento',
      goldType: 'Ouro 18K Amarelo',
      gem: 'Esmeralda Oval 0.8ct e 8 diamantes',
      notes: 'Matéria-prima fundida. Gravação interna solicitada: "Dr. Roberto - 2026".',
      imageUrl: 'https://images.unsplash.com/photo-1543294001-f7cbfe92237e?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'prod_2',
      userId,
      name: 'Corrente Riviera Diamond Elegance',
      description: 'Colar de cravação contínua com 90 diamantes de 3 pontos cada. Estrutura flexível em ouro branco com fecho invisível.',
      weight: 22.0,
      rawMaterial: 'Ouro 18k Branco e 90 Diamantes calibrados',
      estimatedCost: 12000,
      finalCost: 0,
      startDate: formatOffsetDate(-4),
      dueDate: formatOffsetDate(15),
      status: 'Em produção',
      goldType: 'Ouro 18K Branco',
      gem: '90 Diamantes calibrados 0.03ct cada',
      notes: 'Montagem artesanal extremamente delicada. Exige atenção máxima na articulação dos elos.',
      imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const services: ServiceOrder[] = [
    {
      id: 'os_1',
      userId,
      title: 'Ajuste de Aliança Solitário Platina',
      description: 'Reduzir tamanho do aro 16 para 14. Realizar limpeza técnica de ultrassom e polimento espelhado.',
      priceCharged: 450,
      cost: 50,
      entryDate: formatOffsetDate(-6),
      dueDate: formatOffsetDate(-3),
      status: 'Entregue',
      notes: 'Trabalho de soldagem fria com laser de precisão. Concluído com êxito.',
    },
    {
      id: 'os_2',
      userId,
      title: 'Banho de Ouro em Correntes Antigas',
      description: 'Realizar decapagem de impurezas e aplicar banho de 10 milésimos de Ouro Amarelo 18K em 3 correntes venezianas.',
      priceCharged: 850,
      cost: 180,
      entryDate: formatOffsetDate(-10),
      dueDate: formatOffsetDate(-2),
      status: 'Entregue',
      notes: 'Cliente elogiou muito o brilho final do acabamento.',
    },
    {
      id: 'os_3',
      userId,
      title: 'Cravação de Brilhante Caído',
      description: 'Repor brilhante de 5 pontos no brinco direito e refazer garra quebrada do engate.',
      priceCharged: 380,
      cost: 90,
      entryDate: formatOffsetDate(-1),
      dueDate: formatOffsetDate(3),
      status: 'Em execução',
      notes: 'Pedra de reposição de qualidade G-VS2 já selecionada no gaveteiro 4.',
    },
  ];

  const agenda: CalendarEvent[] = [
    {
      id: 'evt_1',
      userId,
      title: 'Entrega do Solitário Crown',
      description: 'Agendado com o cliente Sr. Arthur para retirada no atelier e aprovação final.',
      date: formatOffsetDate(1),
      time: '15:00',
      location: 'Showroom Principal',
      priority: 'alta',
      status: 'pendente',
      color: '#D4AF37',
      notes: 'Servir espumante gelado. Preparar certificado de garantia e laudo gemológico.',
    },
    {
      id: 'evt_2',
      userId,
      title: 'Reunião com Fornecedor de Pedras',
      description: 'Visita técnica de Sr. Alexandre com maleta de gemas lapidadas (rubis e safiras).',
      date: formatOffsetDate(2),
      time: '10:30',
      location: 'Escritório Blackstone',
      priority: 'media',
      status: 'pendente',
      color: '#3B82F6',
      notes: 'Focar na seleção de rubis sangue de pombo calibrados.',
    },
    {
      id: 'evt_3',
      userId,
      title: 'Polimento e Limpeza da Oficina',
      description: 'Manutenção periódica nas polidoras e recolhimento de resíduos de ouro nos filtros.',
      date: formatOffsetDate(0),
      time: '18:00',
      location: 'Bancadas de Ourivesaria',
      priority: 'baixa',
      status: 'pendente',
      color: '#10B981',
      notes: 'Crucial para contabilidade de poeira de ouro trimestral.',
    },
  ];

  const kanban: KanbanCard[] = [
    {
      id: 'kb_1',
      userId,
      type: 'producao',
      sourceId: 'prod_1',
      name: 'Anel Medicina Ouro',
      description: 'Polimento final e gravação interna "Dr. Roberto".',
      dueDate: formatOffsetDate(5),
      priority: 'alta',
      notes: 'Status de produção correspondente: Polimento',
      imageUrl: 'https://images.unsplash.com/photo-1543294001-f7cbfe92237e?w=600&auto=format&fit=crop&q=80',
      status: 'Polimento',
    },
    {
      id: 'kb_2',
      userId,
      type: 'producao',
      sourceId: 'prod_2',
      name: 'Colar Riviera Diamantes',
      description: 'Articulação e cravação manual dos elos.',
      dueDate: formatOffsetDate(15),
      priority: 'alta',
      notes: 'Status de produção correspondente: Em produção',
      imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop&q=80',
      status: 'Em Produção',
    },
    {
      id: 'kb_3',
      userId,
      type: 'os',
      sourceId: 'os_3',
      name: 'Conserto: Cravação Brinco',
      description: 'Repor brilhante e reconstruir garra.',
      dueDate: formatOffsetDate(3),
      priority: 'media',
      notes: 'Status OS: Em execução',
      status: 'Em Produção',
    },
    {
      id: 'kb_4',
      userId,
      type: 'tarefa',
      sourceId: 't_1',
      name: 'Comprar Gás para Maçarico',
      description: 'Recarga do cilindro de oxigênio e gás GLP da fundição.',
      dueDate: formatOffsetDate(1),
      priority: 'alta',
      notes: 'Urgente para as fundições de final de semana.',
      status: 'A Fazer',
    },
  ];

  const notes: NoteItem[] = [
    {
      id: 'note_1',
      userId,
      title: 'Proporção de Liga Ouro 18K',
      content: 'Fórmula padrão utilizada na oficina para produzir 10g de Ouro 18K Amarelo:\n- Ouro Fino (24k): 7.50g (75%)\n- Cobre Puro: 1.25g (12.5%)\n- Prata Pura: 1.25g (12.5%)\n\nPara Ouro Rosé aumentar proporção de cobre para 1.50g e diminuir prata para 1.00g.',
      checklist: [],
      color: 'gold',
      tags: ['Técnico', 'Fórmulas'],
      isPinned: true,
      date: formatOffsetDate(-8),
    },
    {
      id: 'note_2',
      userId,
      title: 'Lista de Compras de Insumos',
      content: 'Insumos de ourivesaria necessários para reposição semanal da oficina:',
      checklist: [
        { id: 'item_1', text: 'Brocas de desgaste tungstênio 0.8mm (2 cartelas)', done: true },
        { id: 'item_2', text: 'Discos de feltro e pasta de polimento verde jacaré', done: false },
        { id: 'item_3', text: 'Solução ácida de decapagem (Pickling solution)', done: false },
        { id: 'item_4', text: 'Serra de ourives Nº 3/0 (1 dúzia)', done: false },
      ],
      color: 'charcoal',
      tags: ['Oficina', 'Estoque'],
      isPinned: false,
      date: formatOffsetDate(-2),
    },
  ];

  const settings: AppSettings = {
    ...DEFAULT_SETTINGS,
    theme: 'luxo',
    companyName: 'Blackstone Diamond',
  };

  return {
    inventory,
    sold,
    cash,
    production,
    services,
    agenda,
    kanban,
    notes,
    settings,
  };
};

// Database class helper
export class BlackstoneDB {
  // Authentication & Management
  static register(user: Omit<UserRegistry, 'id'>): { success: boolean; message: string; user?: User } {
    try {
      const users = this.getAllRegisteredUsers();
      const normalizedEmail = user.email.toLowerCase().trim();

      if (users.find(u => u.email === normalizedEmail)) {
        return { success: false, message: 'Este e-mail já está cadastrado.' };
      }

      const id = 'user_' + Math.random().toString(36).substr(2, 9);
      const newUser: UserRegistry = {
        ...user,
        id,
        email: normalizedEmail,
      };

      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      // Auto provision data for the registered user
      const initialData: UserData = {
        inventory: [],
        sold: [],
        cash: [],
        production: [],
        services: [],
        agenda: [],
        kanban: [],
        notes: [],
        settings: {
          ...DEFAULT_SETTINGS,
          companyName: user.companyName || `${user.name} Joias`,
        },
      };
      
      // If the email is demo or contains 'demo', let's pre-populate it!
      if (normalizedEmail.includes('demo') || normalizedEmail === 'thibithoi@gmail.com') {
        const prefilled = generateDemoData(id);
        localStorage.setItem(DATA_PREFIX + id, JSON.stringify(prefilled));
      } else {
        localStorage.setItem(DATA_PREFIX + id, JSON.stringify(initialData));
      }

      const sanitizedUser: User = {
        id,
        email: newUser.email,
        name: newUser.name,
        companyName: newUser.companyName,
        createdAt: new Date().toISOString(),
      };

      return { success: true, message: 'Cadastro realizado com sucesso!', user: sanitizedUser };
    } catch (e) {
      return { success: false, message: 'Erro ao salvar no banco local.' };
    }
  }

  static login(email: string, passwordHash: string): { success: boolean; message: string; user?: User } {
    const users = this.getAllRegisteredUsers();
    const normalizedEmail = email.toLowerCase().trim();
    const foundUser = users.find(u => u.email === normalizedEmail && u.passwordHash === passwordHash);

    if (!foundUser) {
      // Special: let's auto-register a demo account for convenience if none exists
      if (normalizedEmail === 'thibithoi@gmail.com' || normalizedEmail === 'demo@blackstone.com') {
        const demoUser = {
          email: normalizedEmail,
          name: 'Atelier Blackstone',
          companyName: 'Blackstone Diamond',
          passwordHash: passwordHash || 'demo',
          securityQuestion: SECURITY_QUESTIONS[2],
          securityAnswer: 'Cartier',
        };
        const regRes = this.register(demoUser);
        if (regRes.success) {
          return regRes;
        }
      }
      return { success: false, message: 'E-mail ou senha inválidos.' };
    }

    const sanitizedUser: User = {
      id: foundUser.id,
      email: foundUser.email,
      name: foundUser.name,
      companyName: foundUser.companyName,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sanitizedUser));
    return { success: true, message: 'Autenticado com sucesso!', user: sanitizedUser };
  }

  static logout(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  static getCurrentUser(): User | null {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    if (!data) return null;
    try {
      const parsed = JSON.parse(data) as User;
      if (parsed.companyName === 'Blackstone Diamond Atelier') {
        parsed.companyName = 'Blackstone Diamond';
      }
      return parsed;
    } catch {
      return null;
    }
  }

  static updateProfile(userId: string, updates: Partial<User>): boolean {
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      const updatedUser = { ...currentUser, ...updates };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }

    const users = this.getAllRegisteredUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return true;
    }
    return false;
  }

  static changePassword(userId: string, newPasswordHash: string): boolean {
    const users = this.getAllRegisteredUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].passwordHash = newPasswordHash;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return true;
    }
    return false;
  }

  static recoverPassword(email: string, securityAnswer: string, newPasswordHash: string): { success: boolean; message: string } {
    const users = this.getAllRegisteredUsers();
    const normalizedEmail = email.toLowerCase().trim();
    const userIndex = users.findIndex(u => u.email === normalizedEmail);

    if (userIndex === -1) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    const user = users[userIndex];
    if (user.securityAnswer.toLowerCase().trim() !== securityAnswer.toLowerCase().trim()) {
      return { success: false, message: 'Resposta de segurança incorreta.' };
    }

    user.passwordHash = newPasswordHash;
    users[userIndex] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return { success: true, message: 'Senha redefinida com sucesso!' };
  }

  static getSecurityQuestion(email: string): { success: boolean; question?: string; message?: string } {
    const users = this.getAllRegisteredUsers();
    const normalizedEmail = email.toLowerCase().trim();
    const user = users.find(u => u.email === normalizedEmail);

    if (!user) {
      return { success: false, message: 'E-mail não cadastrado.' };
    }

    return { success: true, question: user.securityQuestion };
  }

  // Get data of a user
  static getUserData(userId: string): UserData {
    const data = localStorage.getItem(DATA_PREFIX + userId);
    if (!data) {
      // Lazy provisioning if empty
      const initial: UserData = {
        inventory: [],
        sold: [],
        cash: [],
        production: [],
        services: [],
        agenda: [],
        kanban: [],
        notes: [],
        settings: DEFAULT_SETTINGS,
      };
      localStorage.setItem(DATA_PREFIX + userId, JSON.stringify(initial));
      return initial;
    }
    try {
      const parsed = JSON.parse(data) as UserData;
      // Make sure essential structures are present
      if (!parsed.inventory) parsed.inventory = [];
      if (!parsed.sold) parsed.sold = [];
      if (!parsed.cash) parsed.cash = [];
      if (!parsed.production) parsed.production = [];
      if (!parsed.services) parsed.services = [];
      if (!parsed.agenda) parsed.agenda = [];
      if (!parsed.kanban) parsed.kanban = [];
      if (!parsed.notes) parsed.notes = [];
      if (!parsed.settings) parsed.settings = DEFAULT_SETTINGS;
      if (parsed.settings.companyName === 'Blackstone Diamond Atelier') {
        parsed.settings.companyName = 'Blackstone Diamond';
      }
      return parsed;
    } catch {
      return generateDemoData(userId);
    }
  }

  // Set/Save data of a user
  static saveUserData(userId: string, data: UserData): void {
    localStorage.setItem(DATA_PREFIX + userId, JSON.stringify(data));
  }

  // Private helpers
  private static getAllRegisteredUsers(): UserRegistry[] {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) {
      // Seed with standard prefilled demo accounts
      const defaultUsers: UserRegistry[] = [
        {
          id: 'user_demo',
          email: 'thibithoi@gmail.com',
          name: 'Atelier Blackstone',
          companyName: 'Blackstone Diamond',
          passwordHash: 'demo',
          securityQuestion: SECURITY_QUESTIONS[2],
          securityAnswer: 'Cartier',
        }
      ];
      localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
      // Provision data for user_demo
      const demoData = generateDemoData('user_demo');
      localStorage.setItem(DATA_PREFIX + 'user_demo', JSON.stringify(demoData));
      return defaultUsers;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
}
