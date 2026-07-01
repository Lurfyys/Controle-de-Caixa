/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, X, Gem, DollarSign, Hammer, ClipboardList, Calendar, Bookmark, ArrowRight } from 'lucide-react';
import { UserData } from '../lib/store';

interface GlobalSearchProps {
  data: UserData;
  onNavigateToTab: (tab: string) => void;
  theme?: 'luxo' | 'claro' | 'rubi';
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  data,
  onNavigateToTab,
  theme = 'luxo',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Simultaneous search algorithm
  const getSearchResults = () => {
    if (!query.trim()) return { inventory: [], sold: [], cash: [], production: [], services: [], agenda: [], notes: [] };
    
    const term = query.toLowerCase().trim();

    const inventory = data.inventory.filter(item => 
      item.name.toLowerCase().includes(term) || 
      item.notes.toLowerCase().includes(term) ||
      item.gem.toLowerCase().includes(term)
    );

    const sold = data.sold.filter(item => 
      item.name.toLowerCase().includes(term) || 
      item.notes.toLowerCase().includes(term)
    );

    const cash = data.cash.filter(tx => 
      tx.description.toLowerCase().includes(term) || 
      tx.category.toLowerCase().includes(term) ||
      tx.subcategory.toLowerCase().includes(term)
    );

    const production = data.production.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.description.toLowerCase().includes(term)
    );

    const services = data.services.filter(os => 
      os.title.toLowerCase().includes(term) || 
      os.description.toLowerCase().includes(term)
    );

    const agenda = data.agenda.filter(evt => 
      evt.title.toLowerCase().includes(term) || 
      evt.description.toLowerCase().includes(term)
    );

    const notes = data.notes.filter(n => 
      n.title.toLowerCase().includes(term) || 
      n.content.toLowerCase().includes(term)
    );

    return { inventory, sold, cash, production, services, agenda, notes };
  };

  const results = getSearchResults();
  const totalResultsCount = 
    results.inventory.length + 
    results.sold.length + 
    results.cash.length + 
    results.production.length + 
    results.services.length + 
    results.agenda.length + 
    results.notes.length;

  const handleResultClick = (tabName: string) => {
    onNavigateToTab(tabName);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" id="global-search-container">
      
      {/* Search trigger bar */}
      <div className="relative flex items-center">
        <Search size={14} className="absolute left-3 text-neutral-500" />
        <input
          type="text"
          placeholder="Pesquisa Global Inteligente..."
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
          className={`pl-9 pr-8 py-2 w-56 md:w-64 rounded-lg text-xs focus:outline-none focus:w-80 transition-all cursor-pointer ${
            theme === 'luxo'
              ? 'bg-neutral-950/40 border border-neutral-800 text-neutral-100 focus:border-amber-500/40'
              : theme === 'claro'
              ? 'bg-stone-50 border border-stone-200 text-stone-900 focus:border-neutral-900'
              : 'bg-stone-950 border border-stone-800 text-neutral-100 focus:border-rose-900'
          }`}
          id="global-search-input"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-2.5 text-neutral-500 hover:text-neutral-300">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Pop-up results overlay panel */}
      {isOpen && query.trim() && (
        <div className={`absolute right-0 mt-2 w-96 rounded-2xl p-4 shadow-2xl z-50 border max-h-[480px] overflow-y-auto backdrop-blur-xl ${
          theme === 'luxo'
            ? 'bg-neutral-950/95 border-amber-500/20 text-neutral-200'
            : theme === 'claro'
            ? 'bg-stone-50 border-stone-300 text-stone-900'
            : 'bg-stone-950/95 border-rose-950 text-stone-100'
        }`} id="global-search-results">
          
          <div className="flex justify-between items-center pb-2 mb-3 border-b border-neutral-800">
            <span className="text-[9px] uppercase tracking-widest font-mono text-neutral-500">
              Resultados da Busca ({totalResultsCount})
            </span>
            <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-neutral-300">
              <X size={12} />
            </button>
          </div>

          {totalResultsCount === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500 font-serif">
              Nenhum dado encontrado para "{query}".
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              
              {/* Category: Inventory available */}
              {results.inventory.length > 0 && (
                <div className="space-y-2">
                  <div className="flex gap-1.5 items-center text-[10px] uppercase tracking-wider text-amber-400 font-semibold font-mono">
                    <Gem size={11} />
                    <span>Estoque Ativo</span>
                  </div>
                  {results.inventory.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleResultClick('inventory')}
                      className="p-2 bg-neutral-900/40 hover:bg-neutral-800/40 rounded border border-neutral-800/50 flex justify-between cursor-pointer transition-colors"
                    >
                      <span className="truncate">{item.name}</span>
                      <ArrowRight size={10} className="text-neutral-500" />
                    </div>
                  ))}
                </div>
              )}

              {/* Category: Sold items */}
              {results.sold.length > 0 && (
                <div className="space-y-2">
                  <div className="flex gap-1.5 items-center text-[10px] uppercase tracking-wider text-emerald-400 font-semibold font-mono">
                    <DollarSign size={11} />
                    <span>Histórico de Vendas</span>
                  </div>
                  {results.sold.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleResultClick('inventory')}
                      className="p-2 bg-neutral-900/40 hover:bg-neutral-800/40 rounded border border-neutral-800/50 flex justify-between cursor-pointer transition-colors"
                    >
                      <span className="truncate">{item.name}</span>
                      <ArrowRight size={10} className="text-neutral-500" />
                    </div>
                  ))}
                </div>
              )}

              {/* Category: Production */}
              {results.production.length > 0 && (
                <div className="space-y-2">
                  <div className="flex gap-1.5 items-center text-[10px] uppercase tracking-wider text-amber-500 font-semibold font-mono">
                    <Hammer size={11} />
                    <span>Produção Oficina</span>
                  </div>
                  {results.production.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleResultClick('production')}
                      className="p-2 bg-neutral-900/40 hover:bg-neutral-800/40 rounded border border-neutral-800/50 flex justify-between cursor-pointer transition-colors"
                    >
                      <span className="truncate">{item.name}</span>
                      <ArrowRight size={10} className="text-neutral-500" />
                    </div>
                  ))}
                </div>
              )}

              {/* Category: OS Service orders */}
              {results.services.length > 0 && (
                <div className="space-y-2">
                  <div className="flex gap-1.5 items-center text-[10px] uppercase tracking-wider text-blue-400 font-semibold font-mono">
                    <ClipboardList size={11} />
                    <span>Ordens de Serviço</span>
                  </div>
                  {results.services.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleResultClick('services')}
                      className="p-2 bg-neutral-900/40 hover:bg-neutral-800/40 rounded border border-neutral-800/50 flex justify-between cursor-pointer transition-colors"
                    >
                      <span className="truncate">{item.title}</span>
                      <ArrowRight size={10} className="text-neutral-500" />
                    </div>
                  ))}
                </div>
              )}

              {/* Category: Notes */}
              {results.notes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex gap-1.5 items-center text-[10px] uppercase tracking-wider text-purple-400 font-semibold font-mono">
                    <Bookmark size={11} />
                    <span>Notas & Fórmulas</span>
                  </div>
                  {results.notes.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleResultClick('notes')}
                      className="p-2 bg-neutral-900/40 hover:bg-neutral-800/40 rounded border border-neutral-800/50 flex justify-between cursor-pointer transition-colors"
                    >
                      <span className="truncate">{item.title}</span>
                      <ArrowRight size={10} className="text-neutral-500" />
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
};
