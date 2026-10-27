import React from 'react';
import { RefreshCw, Radio, ExternalLink } from 'lucide-react';

interface NavbarProps {
  activeTab: '1turno' | '2turno' | 'comparativo' | 'probabilidade' | 'abstencao';
  setActiveTab: (tab: '1turno' | '2turno' | 'comparativo' | 'probabilidade' | 'abstencao') => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated: string | null;
  autoRefreshInterval: number;
  setAutoRefreshInterval: (sec: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isRefreshing,
  onRefresh,
  lastUpdated,
  autoRefreshInterval,
  setAutoRefreshInterval,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090e17]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs tracking-wider">TSE</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              Totalização Eleições 2026
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Radio className="w-3 h-3 animate-pulse" /> Servidores TSE Online
              </span>
              {lastUpdated && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-data">{lastUpdated}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('1turno')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === '1turno'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            1º Turno (Consolidado)
          </button>
          <button
            onClick={() => setActiveTab('2turno')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === '2turno'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            2º Turno (Ao Vivo)
          </button>
          <button
            onClick={() => setActiveTab('comparativo')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'comparativo'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Comparativo por Estado
          </button>
          <button
            onClick={() => setActiveTab('probabilidade')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'probabilidade'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Curva de Probabilidade
          </button>
          <button
            onClick={() => setActiveTab('abstencao')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'abstencao'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Abstenções
          </button>
        </nav>

        {/* Zone 3: Primary Action & Auto-refresh */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
            <span className="text-[11px]">Auto:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value={15} className="bg-slate-900 text-slate-200">15s</option>
              <option value={30} className="bg-slate-900 text-slate-200">30s</option>
              <option value={60} className="bg-slate-900 text-slate-200">60s</option>
              <option value={0} className="bg-slate-900 text-slate-200">Pausado</option>
            </select>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 rounded-lg transition-all shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden overflow-x-auto gap-1 mt-2.5 pt-2 border-t border-slate-800/60 no-scrollbar">
        <button
          onClick={() => setActiveTab('1turno')}
          className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === '1turno' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          1º Turno
        </button>
        <button
          onClick={() => setActiveTab('2turno')}
          className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === '2turno' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          2º Turno (Ao Vivo)
        </button>
        <button
          onClick={() => setActiveTab('comparativo')}
          className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'comparativo' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Comparativo
        </button>
        <button
          onClick={() => setActiveTab('probabilidade')}
          className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'probabilidade' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Curva de Probabilidade
        </button>
        <button
          onClick={() => setActiveTab('abstencao')}
          className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'abstencao' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Abstenções
        </button>
      </div>
    </header>
  );
};
