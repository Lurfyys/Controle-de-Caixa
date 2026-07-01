/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import {
  Plus,
  Search,
  Gem,
  Scale,
  Trash2,
  ShoppingBag,
  X,
  Upload,
  Loader2,
} from "lucide-react";
import { UserData } from "../lib/store";
import { JewelryStatus } from "../types";
import { formatCurrency } from "./SettingsView";
import { api, API_URL } from "../services/api";

interface InventoryProps {
  data: UserData;
  onSaveData: (updatedData: UserData) => void;
  theme?: "luxo" | "claro" | "rubi";
}

type InventoryItem = {
  id: string;
  userId: string;
  name: string;
  category: string;
  weight: number;
  goldType: string;
  gem: string;
  costPrice: number;
  sellPrice: number;
  quantity: number;
  status: JewelryStatus | string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
};

const LUXURY_PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1543294001-f7cbfe92237e?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop&q=80",
];

function resolveImageUrl(imageUrl?: string) {
  if (!imageUrl) {
    return LUXURY_PLACEHOLDERS[Math.floor(Math.random() * LUXURY_PLACEHOLDERS.length)];
  }

  if (imageUrl.startsWith("/uploads")) {
    return `${API_URL}${imageUrl}`;
  }

  return imageUrl;
}

export const Inventory: React.FC<InventoryProps> = ({
  data,
  theme = "luxo",
}) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeSubTab, setActiveSubTab] = useState<"disponivel" | "vendidos">("disponivel");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState(data.settings.categories[0] || "Anéis");
  const [weight, setWeight] = useState("");
  const [goldType, setGoldType] = useState("Ouro 18K Amarelo");
  const [gem, setGem] = useState("Nenhuma");
  const [costPrice, setCostPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [status, setStatus] = useState<JewelryStatus>("Disponível");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currency = data.settings.currency || "BRL";

  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await api.getInventory();
      setInventory(response.inventory || []);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar estoque.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const resetForm = () => {
    setName("");
    setCategory(data.settings.categories[0] || "Anéis");
    setWeight("");
    setGoldType("Ouro 18K Amarelo");
    setGem("Nenhuma");
    setCostPrice("");
    setSellPrice("");
    setDescription("");
    setImageUrl("");
    setImageFile(null);
    setStatus("Disponível");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !category || !weight || !costPrice || !sellPrice) {
      alert("Preencha nome, categoria, peso, custo e venda.");
      return;
    }

    try {
      setSaving(true);

      let finalImageUrl = imageUrl;

      if (imageFile) {
        const uploadResponse = await api.uploadInventoryImage(imageFile);
        finalImageUrl = uploadResponse.imageUrl;
      }

      if (!finalImageUrl) {
        finalImageUrl =
          LUXURY_PLACEHOLDERS[Math.floor(Math.random() * LUXURY_PLACEHOLDERS.length)];
      }

      const response = await api.createInventory({
        name,
        category,
        weight: Number(weight),
        goldType,
        gem,
        costPrice: Number(costPrice),
        sellPrice: Number(sellPrice),
        quantity: 1,
        status,
        description,
        imageUrl: finalImageUrl,
      });

      setInventory((prev) => [response.item, ...prev]);

      resetForm();
      setShowAddModal(false);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao cadastrar joia.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    const confirmed = window.confirm(
      `Deseja realmente excluir a joia "${item.name}" do banco de dados?`
    );

    if (!confirmed) return;

    try {
      await api.deleteInventory(item.id);
      setInventory((prev) => prev.filter((i) => i.id !== item.id));
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao excluir item.");
    }
  };

 const handleMarkAsSold = async (item: InventoryItem) => {
  const confirmed = window.confirm(
    `Marcar "${item.name}" como vendida e lançar entrada no caixa?`
  );

  if (!confirmed) return;

  try {
    setSaving(true);

    const inventoryResponse = await api.updateInventory(item.id, {
      status: "Vendida",
    });

    await api.createCash({
      type: "entrada",
      category: "Venda de joias",
      subcategory: "Estoque",
      amount: Number(item.sellPrice),
      date: new Date().toISOString().split("T")[0],
      description: `Venda da joia: ${item.name}`,
    });

    setInventory((prev) =>
      prev.map((i) => (i.id === item.id ? inventoryResponse.item : i))
    );

    alert("Joia marcada como vendida e entrada lançada no caixa.");
  } catch (error: any) {
    console.error(error);
    alert(error.message || "Erro ao vender joia.");
  } finally {
    setSaving(false);
  }
};

  const filteredInventory = inventory.filter((item) => {
    if (activeSubTab === "disponivel" && item.status === "Vendida") return false;
    if (activeSubTab === "vendidos" && item.status !== "Vendida") return false;

    const search = searchQuery.toLowerCase();

    const matchesSearch =
      item.name.toLowerCase().includes(search) ||
      (item.description || "").toLowerCase().includes(search) ||
      item.gem.toLowerCase().includes(search);

    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const cardBg =
    theme === "luxo"
      ? "bg-neutral-900/40 border border-neutral-800 rounded-xl overflow-hidden shadow-lg hover:border-amber-500/20 transition-all duration-300"
      : theme === "claro"
      ? "bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm"
      : "bg-stone-900/80 border border-stone-800 rounded-xl overflow-hidden shadow-lg";

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
    <div className="space-y-6" id="inventory-module">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className={`text-[10px] uppercase tracking-widest font-semibold ${textAccent}`}>
            Cofre de Acervo
          </span>
          <h1 className={`text-2xl font-serif font-light mt-1 ${textPrimary}`}>
            Gestão de Joias & Peças
          </h1>
          <p className="text-xs text-neutral-500">
            Cadastro de joias salvo no PostgreSQL com imagem no backend.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer font-medium ${buttonPrimary}`}
        >
          <Plus size={14} />
          Cadastrar Joia
        </button>
      </div>

      <div className="flex overflow-x-auto scrollbar-none whitespace-nowrap flex-nowrap border-b border-neutral-800/60 pb-px -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => {
            setActiveSubTab("disponivel");
            setSelectedStatus("all");
          }}
          className={`px-6 py-3 text-xs tracking-widest uppercase font-medium border-b-2 transition-all cursor-pointer ${
            activeSubTab === "disponivel"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Acervo Disponível
        </button>

        <button
          onClick={() => {
            setActiveSubTab("vendidos");
            setSelectedStatus("all");
          }}
          className={`px-6 py-3 text-xs tracking-widest uppercase font-medium border-b-2 transition-all cursor-pointer ${
            activeSubTab === "vendidos"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Histórico de Vendidos
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-neutral-900/10 p-4 rounded-xl border border-neutral-800/40">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3.5 top-3.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por nome, pedras, observações..."
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
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`w-full px-3 py-2.5 rounded-lg text-xs focus:outline-none cursor-pointer ${
              theme === "luxo"
                ? "bg-neutral-950/40 border border-neutral-800 text-neutral-100"
                : "bg-white border border-stone-200 text-stone-900"
            }`}
          >
            <option value="all">Todas Categorias</option>
            {data.settings.categories.map((cat, i) => (
              <option key={i} value={cat} className="bg-neutral-900 text-neutral-100">
                {cat}
              </option>
            ))}
          </select>
        </div>

        {activeSubTab === "disponivel" && (
          <div className="min-w-[150px]">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg text-xs focus:outline-none cursor-pointer ${
                theme === "luxo"
                  ? "bg-neutral-950/40 border border-neutral-800 text-neutral-100"
                  : "bg-white border border-stone-200 text-stone-900"
              }`}
            >
              <option value="all">Todos Status</option>
              <option value="Disponível">Disponível</option>
              <option value="Reservada">Reservada</option>
              <option value="Em produção">Em produção</option>
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-16 border border-dashed border-neutral-800 rounded-2xl text-center space-y-3">
          <Loader2 className="mx-auto text-amber-500 animate-spin" size={32} />
          <p className="text-xs text-neutral-500">Carregando estoque do banco...</p>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="p-16 border border-dashed border-neutral-800 rounded-2xl text-center space-y-3">
          <Gem className="mx-auto text-neutral-600 animate-bounce" size={32} />
          <h3 className={`text-sm font-medium ${textPrimary}`}>Nenhuma joia encontrada</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Tente ajustar seus critérios ou cadastre uma nova joia.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredInventory.map((item) => (
            <div key={item.id} className={cardBg}>
              <div className="h-48 w-full overflow-hidden relative bg-neutral-950">
                <img
                  src={resolveImageUrl(item.imageUrl)}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                  referrerPolicy="no-referrer"
                />

                <span
                  className={`absolute top-3 right-3 text-[9px] uppercase tracking-wider font-semibold font-mono px-2 py-0.5 rounded-full ${
                    item.status === "Disponível"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : item.status === "Reservada"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : item.status === "Vendida"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}
                >
                  {item.status}
                </span>

                <span className="absolute bottom-3 left-3 text-[8px] uppercase tracking-widest bg-neutral-950/80 backdrop-blur-md text-neutral-300 px-2.5 py-1 rounded font-mono">
                  {item.category}
                </span>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h3 className={`text-xs font-serif font-light truncate ${textPrimary}`} title={item.name}>
                    {item.name}
                  </h3>
                  <p className="text-[10px] text-neutral-500 font-mono mt-1">
                    {item.goldType} • {item.gem !== "Nenhuma" ? item.gem : "Sem pedras"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono py-3 border-y border-neutral-800/40">
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <Scale size={11} className="text-neutral-500" />
                    <span>{Number(item.weight).toFixed(2)}g</span>
                  </div>
                  <div className="text-right">
                    <span className="text-neutral-500">
                      Custo: {formatCurrency(Number(item.costPrice), currency)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-neutral-500 block">
                      Preço de Venda
                    </span>
                    <span className={`font-mono font-medium text-sm ${textAccent}`}>
                      {formatCurrency(Number(item.sellPrice), currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all cursor-pointer"
                      title="Excluir Joia"
                    >
                      <Trash2 size={11} />
                    </button>

                    {item.status !== "Vendida" && (
                      <button
                        onClick={() => handleMarkAsSold(item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-semibold cursor-pointer bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                      >
                        <ShoppingBag size={11} />
                        Vender
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 overflow-y-auto max-h-[90vh] ${
              theme === "luxo"
                ? "bg-neutral-900 border-neutral-800 text-neutral-100"
                : "bg-white border-stone-200 text-stone-950"
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-serif font-light tracking-wider">
                Cadastrar Joia no Acervo
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

            <form onSubmit={handleAddItemSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                  Nome da Joia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Anel Solitário Princess Diamante"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded focus:outline-none focus:border-amber-500 text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded focus:outline-none focus:border-amber-500 text-neutral-100"
                  >
                    {data.settings.categories.map((cat, i) => (
                      <option key={i} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as JewelryStatus)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded focus:outline-none focus:border-amber-500 text-neutral-100"
                  >
                    <option value="Disponível">Disponível</option>
                    <option value="Reservada">Reservada</option>
                    <option value="Em produção">Em produção</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Peso Bruto (g) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 8.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded focus:outline-none focus:border-amber-500 text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Tipo de Ouro
                  </label>
                  <input
                    type="text"
                    value={goldType}
                    onChange={(e) => setGoldType(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded focus:outline-none focus:border-amber-500 text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Pedra / Gemas
                  </label>
                  <input
                    type="text"
                    value={gem}
                    onChange={(e) => setGem(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded focus:outline-none focus:border-amber-500 text-neutral-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Valor de Custo ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded focus:outline-none focus:border-amber-500 text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Valor de Venda ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded focus:outline-none focus:border-amber-500 text-neutral-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-2">
                  Foto da Joia
                </label>

                {imageUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950 h-36 flex items-center justify-center">
                    <img src={imageUrl} alt="Preview" className="h-full object-contain" />

                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl("");
                        setImageFile(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-md cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-neutral-800 bg-neutral-950 hover:bg-neutral-900/60 transition-colors text-center text-neutral-400 hover:text-neutral-200 cursor-pointer"
                  >
                    <Upload size={20} className="mb-2 text-amber-500" />
                    <span className="text-xs font-medium font-sans">
                      Selecionar Imagem do Celular / PC
                    </span>
                    <span className="text-[10px] text-neutral-500 mt-1 font-sans">
                      PNG, JPG ou WEBP
                    </span>
                  </button>
                )}

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="pt-3">
                  <span className="text-[9px] text-neutral-500 block mb-1 uppercase font-mono">
                    Ou cole o link direto da imagem
                  </span>
                  <input
                    type="url"
                    placeholder="Ex: https://site.com/imagem.jpg"
                    value={imageFile ? "" : imageUrl}
                    onChange={(e) => {
                      setImageFile(null);
                      setImageUrl(e.target.value);
                    }}
                    className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded focus:outline-none focus:border-amber-500 text-neutral-100 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                  Observações
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalhes adicionais, garantias, pureza do metal..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded focus:outline-none focus:border-amber-500 text-neutral-100"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-neutral-950 font-bold uppercase tracking-widest rounded-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Salvando..." : "Adicionar ao Cofre de Peças"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};