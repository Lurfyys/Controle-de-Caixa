/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  X, 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  AlertCircle,
  FileText,
  User,
  ExternalLink
} from 'lucide-react';
import { UserData } from '../lib/store';
import { ServiceOrder, OSStatus } from '../types';
import { formatCurrency } from './SettingsView';

interface ServicesProps {
  data: UserData;
  onSaveData: (updatedData: UserData) => void;
  theme?: 'luxo' | 'claro' | 'rubi';
}

const OS_STAGES: OSStatus[] = [
  'Recebido',
  'Em análise',
  'Aguardando material',
  'Em execução',
  'Pronto',
  'Entregue',
];

export const Services: React.FC<ServicesProps> = ({
  data,
  onSaveData,
  theme = 'luxo',
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // New Service Order Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceCharged, setPriceCharged] = useState('');
  const [cost, setCost] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const currency = data.settings.currency || 'BRL';

  // CREATE ORDER SUBMIT
  const handleCreateOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !priceCharged || !dueDate) return;

    const newOS: ServiceOrder = {
      id: 'os_' + Math.random().toString(36).substr(2, 9),
      userId: 'current',
      title,
      description,
      priceCharged: parseFloat(priceCharged) || 0,
      cost: parseFloat(cost) || 0,
      entryDate: new Date().toISOString().split('T')[0],
      dueDate,
      status: 'Recebido',
      notes,
      imageUrl: imageUrl || '',
    };

    onSaveData({
      ...data,
      services: [newOS, ...data.services],
    });

    // Reset Form
    setShowAddModal(false);
    setTitle('');
    setDescription('');
    setPriceCharged('');
    setCost('');
    setDueDate('');
    setNotes('');
    setImageUrl('');
  };

  // MANAGE STATUS WITH CASH LEDGER AUTO-ENTRY WHEN CONCLUDED/PAID
  const handleUpdateOSStatus = (id: string, newStatus: OSStatus) => {
    const originalOS = data.services.find(os => os.id === id);
    if (!originalOS) return;

    // RULE: "Ao concluir e marcar como pago (Entregue / Pronto & Pago): Gerar automaticamente uma entrada financeira no Caixa utilizando o valor cobrado."
    // If the transition goes to 'Entregue' from another state, generate financial ledger entry
    const isPayingNow = newStatus === 'Entregue' && originalOS.status !== 'Entregue';

    let updatedCash = [...data.cash];
    if (isPayingNow) {
      const newCashTx = {
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        userId: originalOS.userId,
        type: 'entrada' as const,
        category: 'Consertos',
        subcategory: 'Ordem de Serviço',
        amount: originalOS.priceCharged,
        date: new Date().toISOString().split('T')[0],
        description: `OS Concluída e Paga: ${originalOS.title}`,
        linkedType: 'os' as const,
        linkedId: originalOS.id,
      };
      updatedCash = [newCashTx, ...updatedCash];
    }

    const updatedServices = data.services.map(os => {
      if (os.id === id) {
        return { ...os, status: newStatus };
      }
      return os;
    });

    onSaveData({
      ...data,
      services: updatedServices,
      cash: updatedCash,
    });
  };

  // Filter
  const filteredServices = data.services.filter(os => {
    const matchesSearch = os.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          os.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || os.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Styles
  const cardBg = theme === 'luxo'
    ? 'bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 shadow-lg backdrop-blur-md'
    : theme === 'claro'
    ? 'bg-white border border-stone-200 rounded-xl p-5 shadow-sm'
    : 'bg-stone-900/90 border border-stone-800 rounded-xl p-5 shadow-lg';

  const textPrimary = theme === 'claro' ? 'text-stone-900' : 'text-white';
  const textSecondary = theme === 'claro' ? 'text-stone-500' : 'text-neutral-400';
  const textAccent = theme === 'luxo' ? 'text-amber-400' : theme === 'claro' ? 'text-stone-800 font-semibold' : 'text-rose-400';
  const buttonPrimary = theme === 'luxo'
    ? 'bg-amber-500 hover:bg-amber-600 text-neutral-950 font-medium'
    : theme === 'claro'
    ? 'bg-neutral-900 hover:bg-neutral-800 text-white'
    : 'bg-rose-900 hover:bg-rose-800 text-white';

  return (
    <div className="space-y-6" id="services-module">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className={`text-[10px] uppercase tracking-widest font-semibold ${textAccent}`}>
            Ajustes & Banho Químico
          </span>
          <h1 className={`text-2xl font-serif font-light mt-1 ${textPrimary}`}>Ordens de Serviço</h1>
          <p className="text-xs text-neutral-500">Ordens de reparos em joias de clientes. Liquidações geram receitas automáticas.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer font-medium ${buttonPrimary}`}
          id="btn-add-service-order"
        >
          <Plus size={14} />
          Abrir Ordem de Serviço
        </button>
      </div>

      {/* FILTER & BAR */}
      <div className="flex flex-col sm:flex-row gap-4 bg-neutral-900/10 p-4 rounded-xl border border-neutral-800/40">
        
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3.5 top-3.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por serviços, diagnósticos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-xs focus:outline-none focus:border-amber-500/50 transition-all ${
              theme === 'luxo'
                ? 'bg-neutral-950/40 border border-neutral-800 text-neutral-100'
                : 'bg-white border border-stone-200 text-stone-900'
            }`}
            id="search-os-input"
          />
        </div>

        <div className="min-w-[150px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`w-full px-3 py-2.5 rounded-lg text-xs focus:outline-none cursor-pointer ${
              theme === 'luxo'
                ? 'bg-neutral-950/40 border border-neutral-800 text-neutral-100'
                : 'bg-white border border-stone-200 text-stone-900'
            }`}
            id="filter-os-status-select"
          >
            <option value="all">Todos Status</option>
            {OS_STAGES.map((stg, i) => (
              <option key={i} value={stg} className="bg-neutral-900 text-neutral-100">{stg}</option>
            ))}
          </select>
        </div>

      </div>

      {/* OS DISPLAY BOX */}
      {filteredServices.length === 0 ? (
        <div className="p-16 border border-dashed border-neutral-800 rounded-2xl text-center space-y-3">
          <ClipboardList className="mx-auto text-neutral-600 animate-pulse" size={32} />
          <h3 className={`text-sm font-medium ${textPrimary}`}>Nenhum bilhete operacional</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">Não há consertos ou limpezas registradas nas bancadas. Clique acima para abrir um chamado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(os => (
            <div key={os.id} className={cardBg} id={`os-card-${os.id}`}>
              
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] text-neutral-500 font-mono font-bold">OS #{os.id}</span>
                  <h3 className={`text-sm font-medium truncate mt-0.5 ${textPrimary}`}>{os.title}</h3>
                  <span className="text-[9px] text-neutral-500 font-mono block mt-1">
                    Entrada: {new Date(os.entryDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <span className={`text-[9px] uppercase tracking-wider font-semibold font-mono px-2 py-0.5 rounded-full ${
                  os.status === 'Entregue'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : os.status === 'Pronto'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {os.status}
                </span>
              </div>

              <p className="text-xs text-neutral-400 mt-3 leading-relaxed min-h-[40px] line-clamp-2">{os.description}</p>

              {/* OS cost stats */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono py-2.5 my-3 border-y border-neutral-800/40">
                <span className="text-neutral-500">Custo: {formatCurrency(os.cost, currency)}</span>
                <span className="text-right text-emerald-400 font-medium">Cobrado: {formatCurrency(os.priceCharged, currency)}</span>
              </div>

              {/* Notes block */}
              {os.notes && (
                <p className="text-[10px] text-neutral-500 italic truncate mb-4">Obs: {os.notes}</p>
              )}

              {/* Status Update Trigger */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-neutral-500 mb-1 font-mono">Modificar Status</label>
                  <select
                    value={os.status}
                    onChange={(e) => handleUpdateOSStatus(os.id, e.target.value as OSStatus)}
                    className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-[11px] text-neutral-200 cursor-pointer font-medium"
                  >
                    {OS_STAGES.map((stg, i) => (
                      <option key={i} value={stg}>{stg}</option>
                    ))}
                  </select>
                </div>

                {os.status === 'Pronto' && (
                  <button
                    onClick={() => handleUpdateOSStatus(os.id, 'Entregue')}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold uppercase tracking-widest text-[10px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 size={12} />
                    Dar Baixa & Registrar Pagamento
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD SERVICES OS */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm" id="modal-add-service">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-neutral-100">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-serif font-light tracking-wider">Lançar Ordem de Serviço</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-500 hover:text-neutral-300">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOS} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Título do Serviço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Solda de corrente e banho de ródio"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100"
                  id="add-os-title"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Diagnóstico Técnico / Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Corrente veneziana rompida, requer 1 ponto de solda com laser..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100"
                  id="add-os-desc"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Valor Cobrado ({currency}) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 450"
                    value={priceCharged}
                    onChange={(e) => setPriceCharged(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100 font-mono"
                    id="add-os-price"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Custo Interno Estimado ({currency})</label>
                  <input
                    type="number"
                    placeholder="Ex: 50"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100 font-mono"
                    id="add-os-cost"
                  />
                </div>

              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Data Estimada de Entrega *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100 font-mono"
                  id="add-os-due"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Observações de Prateleira</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Entregar com flanela mágica de polimento..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-neutral-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold uppercase tracking-widest rounded-lg cursor-pointer"
                id="btn-confirm-add-os"
              >
                Abrir Chamado Técnico
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
