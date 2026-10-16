import React, { useState } from 'react';
import { useBrowserStore } from '../store';
import { LayoutGrid, Sparkles, X, ArrowUpRight, Search } from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Category = 'All' | 'Ops' | 'Research' | 'Sales' | 'Data' | 'Marketing' | 'Engineering';

interface TemplateItem {
  id: string;
  title: string;
  description: string;
  category: Category;
  apps: string[];
  prompt: string;
}

const templatesData: TemplateItem[] = [
  {
    id: 'tpl-1',
    title: 'Monitor Competitor Pricing & Updates',
    description: 'Navega diariamente em sites concorrentes, extrai preços atuais e resume mudanças de catálogo.',
    category: 'Research',
    apps: ['🌐 Web', '📊 Sheets'],
    prompt: 'Acesse os principais sites de e-commerce e extraia uma tabela comparativa de preços dos top 3 concorrentes.'
  },
  {
    id: 'tpl-2',
    title: 'Daily Tech News & AI Digest',
    description: 'Coleta os 5 principais lançamentos de inteligência artificial do dia no Twitter/X, Hacker News e TechCrunch.',
    category: 'Research',
    apps: ['🌐 TechCrunch', '💬 Slack'],
    prompt: 'Faça um briefing detalhado com as 5 principais notícias de inteligência artificial e dados publicadas hoje.'
  },
  {
    id: 'tpl-3',
    title: 'LinkedIn Lead Sourcing & Enrichment',
    description: 'Encontra perfis de decisores em TI e Finanças no LinkedIn e compila lista com cargo e empresa.',
    category: 'Sales',
    apps: ['💼 LinkedIn', '📊 Sheets'],
    prompt: 'Navegue no LinkedIn e compile uma lista com 10 perfis de diretores de dados e tecnologia em fintechs.'
  },
  {
    id: 'tpl-4',
    title: 'YouTube Deep Video Summarizer',
    description: 'Abre vídeo ou podcast no YouTube, analisa os pontos-chave e gera resumo executivo com timestamps.',
    category: 'Marketing',
    apps: ['▶ YouTube', '📝 Docs'],
    prompt: 'Abra o YouTube, busque as novidades mais recentes de agentes de IA e resuma os principais pontos.'
  },
  {
    id: 'tpl-5',
    title: 'GitHub Issues & PR Triaging',
    description: 'Examina repositórios de projetos abertos, rotula novos pull requests e resume pendências de bugs.',
    category: 'Engineering',
    apps: ['🐙 GitHub', '💬 Slack'],
    prompt: 'Acesse o GitHub, analise as issues recentes do projeto e gere um relatório de prioridades.'
  },
  {
    id: 'tpl-6',
    title: 'Data Quality & Anomaly Detection',
    description: 'Varre relatórios em dashboards internos e aponta desvios de métricas ou dados inconsistentes.',
    category: 'Data',
    apps: ['📊 BI Dashboard', '📧 Email'],
    prompt: 'Verifique os gráficos de performance e aponte anomalias ou quedas atípicas de tráfego.'
  }
];

export const TemplatesModal: React.FC<TemplatesModalProps> = ({ isOpen, onClose }) => {
  const [selectedCat, setSelectedCat] = useState<Category>('All');
  const [search, setSearch] = useState('');
  const { sendMessage, createNewSession } = useBrowserStore();

  if (!isOpen) return null;

  const categories: Category[] = ['All', 'Ops', 'Research', 'Sales', 'Data', 'Marketing', 'Engineering'];

  const filtered = templatesData.filter((item) => {
    const matchesCat = selectedCat === 'All' || item.category === selectedCat;
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                          item.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleUseTemplate = (template: TemplateItem) => {
    createNewSession();
    setTimeout(() => {
      sendMessage(template.prompt);
    }, 100);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-cardBorder overflow-hidden z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header da Galeria de Templates */}
        <div className="p-5 border-b border-sidebarBorder flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-textPrimary flex items-center gap-2">
                Templates Hub
                <span className="text-[10px] font-mono font-semibold bg-polarBlue/10 text-polarBlue px-2 py-0.5 rounded-full">
                  Polar Catalog
                </span>
              </h2>
              <p className="text-xs text-textSecondary">
                Automações e prompts pré-construídos para acelerar tarefas complexas no navegador.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-textMuted hover:text-textPrimary hover:bg-sidebarHover transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="px-5 py-3 border-b border-sidebarBorder bg-sidebarBg flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                  selectedCat === cat
                    ? 'bg-polarBlue text-white shadow-xs'
                    : 'bg-white border border-cardBorder text-textSecondary hover:bg-sidebarHover hover:text-textPrimary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-textMuted absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar template..."
              className="w-full bg-white border border-cardBorder rounded-lg pl-8 pr-3 py-1 text-xs text-textPrimary placeholder-textMuted outline-none focus:border-polarBlue transition"
            />
          </div>
        </div>

        {/* Grid de Cards de Templates */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              className="border border-cardBorder rounded-xl p-4 bg-white hover:border-polarBlue hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="text-xs font-bold text-textPrimary group-hover:text-polarBlue transition">
                    {tpl.title}
                  </h3>
                  <span className="text-[10px] font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full shrink-0">
                    {tpl.category}
                  </span>
                </div>
                <p className="text-[11px] text-textSecondary leading-relaxed mb-3">
                  {tpl.description}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {tpl.apps.map((app, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-sidebarBg border border-sidebarBorder px-2 py-0.5 rounded text-textSecondary font-medium"
                    >
                      {app}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleUseTemplate(tpl)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-polarBlue hover:text-polarBlueHover transition"
                >
                  <span>Use template</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
