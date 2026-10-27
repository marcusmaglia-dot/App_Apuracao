import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, ArrowRight, ArrowUpDown, 
  Search, Filter, ExternalLink, Download, AlertCircle,
  Eye, BarChart2, Layers
} from 'lucide-react';
import { ComparativeResponse, StateComparison } from '../types/election';
import { 
  formatNumberBR, 
  formatPercentBR, 
  formatDeltaNumberBR, 
  formatDeltaPercentBR 
} from '../utils/formatters';

interface ComparativoEstadosViewProps {
  data: ComparativeResponse | null;
  isLoading: boolean;
  onSelectStateDetail: (state: StateComparison) => void;
}

export const ComparativoEstadosView: React.FC<ComparativoEstadosViewProps> = ({
  data,
  isLoading,
  onSelectStateDetail,
}) => {
  const [regionFilter, setRegionFilter] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'eleitorado' | 'vantagem1' | 'vantagem2' | 'abstencao' | 'variacao1' | 'variacao2' | 'uf'>('eleitorado');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const filteredStates = useMemo(() => {
    if (!data || !data.estados) return [];
    let list = [...data.estados];

    // Filter by Region
    if (regionFilter !== 'todas') {
      list = list.filter(s => s.regiao.toLowerCase() === regionFilter.toLowerCase());
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        s => s.uf.toLowerCase().includes(q) ||
             s.nomeEstado.toLowerCase().includes(q) ||
             s.regiao.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'eleitorado') return b.totalEleitores - a.totalEleitores;
      if (sortBy === 'vantagem1') return (b.candidato1.percentual2T - b.candidato2.percentual2T) - (a.candidato1.percentual2T - a.candidato2.percentual2T);
      if (sortBy === 'vantagem2') return (b.candidato2.percentual2T - b.candidato1.percentual2T) - (a.candidato2.percentual2T - a.candidato1.percentual2T);
      if (sortBy === 'abstencao') return b.percentualAbstencao2T - a.percentualAbstencao2T;
      if (sortBy === 'variacao1') return b.candidato1.variacaoPctPoints - a.candidato1.variacaoPctPoints;
      if (sortBy === 'variacao2') return b.candidato2.variacaoPctPoints - a.candidato2.variacaoPctPoints;
      if (sortBy === 'uf') return a.uf.localeCompare(b.uf);
      return 0;
    });

    return list;
  }, [data, regionFilter, searchQuery, sortBy]);

  // Placar de Estados summary
  const placarSummary = useMemo(() => {
    if (!data || !data.estados) return { c1_1T: 0, c2_1T: 0, c1_2T: 0, c2_2T: 0, viradas: 0 };
    let c1_1T = 0;
    let c2_1T = 0;
    let c1_2T = 0;
    let c2_2T = 0;
    let viradas = 0;

    data.estados.forEach(s => {
      if (s.candidato1.votos1T > s.candidato2.votos1T) c1_1T++;
      else if (s.candidato2.votos1T > s.candidato1.votos1T) c2_1T++;

      if (s.candidato1.votos2T > s.candidato2.votos2T) c1_2T++;
      else if (s.candidato2.votos2T > s.candidato1.votos2T) c2_2T++;

      if (s.houveVirada) viradas++;
    });

    return { c1_1T, c2_1T, c1_2T, c2_2T, viradas };
  }, [data]);

  // Export CSV
  const handleExportCSV = () => {
    if (!data || !data.estados) return;
    const headers = [
      'UF', 'Estado', 'Regiao', 'Eleitorado', 'Secoes_2T_Pct',
      'Cand1_Nome', 'Cand1_Votos_1T', 'Cand1_Pct_1T', 'Cand1_Votos_2T', 'Cand1_Pct_2T', 'Cand1_Saldo_Votos', 'Cand1_Var_PP',
      'Cand2_Nome', 'Cand2_Votos_1T', 'Cand2_Pct_1T', 'Cand2_Votos_2T', 'Cand2_Pct_2T', 'Cand2_Saldo_Votos', 'Cand2_Var_PP',
      'Abstencao_Pct_1T', 'Abstencao_Pct_2T', 'Var_Abstencao_PP', 'Lider_1T', 'Lider_2T', 'Virada'
    ];

    const rows = data.estados.map(s => [
      s.uf,
      `"${s.nomeEstado}"`,
      s.regiao,
      s.totalEleitores,
      `${s.percentualSecoes2T}%`,
      `"${s.candidato1.nome}"`,
      s.candidato1.votos1T,
      `${s.candidato1.percentual1T}%`,
      s.candidato1.votos2T,
      `${s.candidato1.percentual2T}%`,
      s.candidato1.variacaoVotosAbs,
      s.candidato1.variacaoPctPoints,
      `"${s.candidato2.nome}"`,
      s.candidato2.votos1T,
      `${s.candidato2.percentual1T}%`,
      s.candidato2.votos2T,
      `${s.candidato2.percentual2T}%`,
      s.candidato2.variacaoVotosAbs,
      s.candidato2.variacaoPctPoints,
      `${s.percentualAbstencao1T}%`,
      `${s.percentualAbstencao2T}%`,
      s.variacaoAbstencaoPctPoints,
      `"${s.lider1T}"`,
      `"${s.lider2T}"`,
      s.houveVirada ? 'SIM' : 'NAO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tse-comparativo-eleicoes-2026-estados.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Cruzando dados de apuração estado por estado do TSE...</p>
      </div>
    );
  }

  if (!data || !data.estados) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">Dados Comparativos Indisponíveis</h3>
        <p className="text-sm text-slate-400 mt-1">
          Não foi possível cruzar os dados dos turnos neste momento.
        </p>
      </div>
    );
  }

  // Strictly identify candidate names and parties:
  // 22 = Flávio Bolsonaro (PL)
  // 13 = Lula (PT)
  const c1Name = 'FLAVIO BOLSONARO';
  const c1Party = 'PL';
  const c2Name = 'LULA';
  const c2Party = 'PT';

  const candFlavio2T = data.totaisBrasil.turno2.candidatos.find(c => c.numero === '22') || data.totaisBrasil.turno2.candidatos[0];
  const candLula2T = data.totaisBrasil.turno2.candidatos.find(c => c.numero === '13') || data.totaisBrasil.turno2.candidatos[1];

  const candFlavio1T = data.totaisBrasil.turno1.candidatos.find(c => c.numero === '22');
  const candLula1T = data.totaisBrasil.turno1.candidatos.find(c => c.numero === '13');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Tribunal Superior Eleitoral</span>
            <span aria-hidden="true">·</span>
            <span>Painel Comparativo de Pleitos</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-medium">1º Turno (Final) vs 2º Turno (Pleito 6258)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Comparativo Eleitoral por Estado (1º Turno vs 2º Turno)
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Análise aprofundada da migração de votos nominais de <strong>Flávio Bolsonaro (PL)</strong> e <strong>Lula (PT)</strong>, variação percentual e oscilação da abstenção em cada uma das 27 Unidades da Federação e no Exterior.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="https://resultados.tse.jus.br/oficial/app/index.html#/eleicao/6258/uf/br/cargo/1/vis/nominal/resultados"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>Ver no TSE Oficial</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Comparativo (CSV)</span>
          </button>
        </div>
      </div>

      {/* National Delta Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Flávio Bolsonaro (PL) National Delta */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-blue-400">FLAVIO BOLSONARO (PL)</span>
            <span className="text-[11px] font-data">Variação Nacional</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white font-data">
              {formatDeltaPercentBR(data.totaisBrasil.candidato1DeltaPctPoints)}
            </span>
            <span className="text-xs text-slate-400 font-data">
              ({formatDeltaNumberBR(data.totaisBrasil.candidato1DeltaVotos)} votos)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-data">
            1ºT: {formatPercentBR(candFlavio1T?.percentual)} ➔ 2ºT: {formatPercentBR(candFlavio2T?.percentual)}
          </div>
        </div>

        {/* Lula (PT) National Delta */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-red-400">LULA (PT)</span>
            <span className="text-[11px] font-data">Variação Nacional</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white font-data">
              {formatDeltaPercentBR(data.totaisBrasil.candidato2DeltaPctPoints)}
            </span>
            <span className="text-xs text-slate-400 font-data">
              ({formatDeltaNumberBR(data.totaisBrasil.candidato2DeltaVotos)} votos)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-data">
            1ºT: {formatPercentBR(candLula1T?.percentual)} ➔ 2ºT: {formatPercentBR(candLula2T?.percentual)}
          </div>
        </div>

        {/* National Abstention Delta */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-amber-400">Abstenção Nacional</span>
            <span className="text-[11px] font-data">Oscilação</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-bold font-data ${
              data.totaisBrasil.variacaoAbstencaoPctPoints > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {formatDeltaPercentBR(data.totaisBrasil.variacaoAbstencaoPctPoints)}
            </span>
            <span className="text-xs text-slate-400 font-data">
              ({formatDeltaNumberBR(data.totaisBrasil.variacaoAbstencaoAbs)} eleitores)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            1ºT: {formatPercentBR(data.totaisBrasil.turno1.percentualAbstencao)} ➔ 2ºT: {formatPercentBR(data.totaisBrasil.turno2.percentualAbstencao)}
          </div>
        </div>

        {/* Placar de Estados */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-slate-300">Mapa de Liderança nos Estados</span>
            <span className="text-[11px]">28 territórios</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="text-sm font-bold text-blue-400 font-data">
              {c1Name.split(' ')[0]}: <span className="text-white text-base">{placarSummary.c1_2T}</span> UFs
            </div>
            <span className="text-slate-600">|</span>
            <div className="text-sm font-bold text-red-400 font-data">
              {c2Name.split(' ')[0]}: <span className="text-white text-base">{placarSummary.c2_2T}</span> UFs
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            {placarSummary.viradas > 0 ? (
              <span className="text-amber-400 font-medium">
                {placarSummary.viradas} {placarSummary.viradas === 1 ? 'estado com virada' : 'estados com virada'} de liderança!
              </span>
            ) : (
              <span>Lideranças alinhadas ao resultado do 1º turno</span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        {/* Region segmented buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar">
          {[
            { id: 'todas', label: 'Todas as UFs (28)' },
            { id: 'sudeste', label: 'Sudeste' },
            { id: 'nordeste', label: 'Nordeste' },
            { id: 'sul', label: 'Sul' },
            { id: 'norte', label: 'Norte' },
            { id: 'centro-oeste', label: 'Centro-Oeste' },
            { id: 'exterior', label: 'Exterior (ZZ)' },
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setRegionFilter(r.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                regionFilter === r.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 md:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar estado ou UF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full sm:w-44"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="eleitorado" className="bg-slate-900 text-slate-200">Maior Eleitorado</option>
              <option value="vantagem1" className="bg-slate-900 text-slate-200">Vantagem {c1Name.split(' ')[0]}</option>
              <option value="vantagem2" className="bg-slate-900 text-slate-200">Vantagem {c2Name.split(' ')[0]}</option>
              <option value="variacao1" className="bg-slate-900 text-slate-200">Maior Alta {c1Name.split(' ')[0]}</option>
              <option value="variacao2" className="bg-slate-900 text-slate-200">Maior Alta {c2Name.split(' ')[0]}</option>
              <option value="abstencao" className="bg-slate-900 text-slate-200">Maior Abstenção</option>
              <option value="uf" className="bg-slate-900 text-slate-200">Ordem Alfabética</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tabela Comparativa"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'cards' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Cartões dos Estados"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* State List: Table or Cards */}
      {viewMode === 'table' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">UF</th>
                  <th className="py-3 px-3">Estado / Região</th>
                  <th className="py-3 px-3 text-right">Apurado 2ºT</th>
                  <th className="py-3 px-4 text-center bg-blue-950/20 text-blue-300">
                    {c1Name} (PL) - 1ºT ➔ 2ºT
                  </th>
                  <th className="py-3 px-4 text-center bg-red-950/20 text-red-300">
                    {c2Name} (PT) - 1ºT ➔ 2ºT
                  </th>
                  <th className="py-3 px-3 text-center">Abstenção 1ºT ➔ 2ºT</th>
                  <th className="py-3 px-3 text-center">Líder 2ºT / Virada</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredStates.map((s) => {
                  const c1IsLeading = s.candidato1.votos2T > s.candidato2.votos2T;
                  const c2IsLeading = s.candidato2.votos2T > s.candidato1.votos2T;

                  return (
                    <tr key={s.uf} className="hover:bg-slate-800/40 transition-colors">
                      {/* UF Code */}
                      <td className="py-3.5 px-3">
                        <span className="font-data font-bold px-2 py-1 bg-slate-800 text-white rounded text-xs border border-slate-700">
                          {s.uf}
                        </span>
                      </td>

                      {/* State Name & Region */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white text-sm">{s.nomeEstado}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-data">
                          <span>{s.regiao}</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatNumberBR(s.totalEleitores)} eleitores</span>
                        </div>
                      </td>

                      {/* Sections Apuradas */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="font-data font-bold text-white text-xs">
                          {formatPercentBR(s.percentualSecoes2T)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-data">
                          {formatNumberBR(s.secoesTotalizadas2T)} seções
                        </div>
                      </td>

                      {/* Cand 1: 1T vs 2T */}
                      <td className="py-3.5 px-4 bg-blue-950/10 border-x border-slate-800/40">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400 font-data">1ºT: {formatPercentBR(s.candidato1.percentual1T)}</span>
                          <span className="text-slate-500">➔</span>
                          <span className="font-bold text-blue-400 font-data text-sm">
                            2ºT: {formatPercentBR(s.candidato1.percentual2T)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-data">
                          <span className="text-slate-400">
                            {formatNumberBR(s.candidato1.votos2T)} votos
                          </span>
                          <span className={`font-semibold ${
                            s.candidato1.variacaoPctPoints >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {formatDeltaPercentBR(s.candidato1.variacaoPctPoints)}
                          </span>
                        </div>
                      </td>

                      {/* Cand 2: 1T vs 2T */}
                      <td className="py-3.5 px-4 bg-red-950/10 border-r border-slate-800/40">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400 font-data">1ºT: {formatPercentBR(s.candidato2.percentual1T)}</span>
                          <span className="text-slate-500">➔</span>
                          <span className="font-bold text-red-400 font-data text-sm">
                            2ºT: {formatPercentBR(s.candidato2.percentual2T)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-data">
                          <span className="text-slate-400">
                            {formatNumberBR(s.candidato2.votos2T)} votos
                          </span>
                          <span className={`font-semibold ${
                            s.candidato2.variacaoPctPoints >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {formatDeltaPercentBR(s.candidato2.variacaoPctPoints)}
                          </span>
                        </div>
                      </td>

                      {/* Abstention: 1T vs 2T */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="font-data font-semibold text-xs text-slate-200">
                          {formatPercentBR(s.percentualAbstencao1T)} ➔ {formatPercentBR(s.percentualAbstencao2T)}
                        </div>
                        <div className={`text-[11px] font-data font-medium mt-0.5 ${
                          s.variacaoAbstencaoPctPoints > 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {formatDeltaPercentBR(s.variacaoAbstencaoPctPoints)}
                        </div>
                      </td>

                      {/* Leader / Flip */}
                      <td className="py-3.5 px-3 text-center">
                        {s.houveVirada ? (
                          <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[11px] inline-flex items-center gap-1">
                            VIRADA: {s.lider2T.split(' ')[0]}
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            c1IsLeading
                              ? 'bg-blue-500/20 text-blue-400'
                              : c2IsLeading
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {s.lider2T.split(' ')[0]} ({formatPercentBR(s.diferencaPct2T)} de margem)
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => onSelectStateDetail(s)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Detalhes</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStates.map((s) => {
            const c1IsLeading = s.candidato1.votos2T > s.candidato2.votos2T;

            return (
              <div
                key={s.uf}
                className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                  s.houveVirada
                    ? 'border-amber-500/50 shadow-lg shadow-amber-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-data font-bold px-2.5 py-1 bg-slate-800 text-white rounded-lg text-sm border border-slate-700">
                        {s.uf}
                      </span>
                      <div>
                        <h3 className="font-bold text-white text-base tracking-tight leading-snug">
                          {s.nomeEstado}
                        </h3>
                        <div className="text-xs text-slate-400">
                          Região {s.regiao} · {formatNumberBR(s.totalEleitores)} eleitores
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400 font-data">
                        {formatPercentBR(s.percentualSecoes2T)}
                      </div>
                      <div className="text-[10px] text-slate-500">apurado</div>
                    </div>
                  </div>

                  {/* Virada Alert */}
                  {s.houveVirada && (
                    <div className="mb-3 p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Virada: {s.lider2T} assumiu a liderança no 2ºT!</span>
                    </div>
                  )}

                  {/* Dual Candidate Results Comparison */}
                  <div className="space-y-2.5 mt-3">
                    {/* Candidate 1 */}
                    <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-900/40">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-blue-400">{s.candidato1.nome} ({s.candidato1.partido || 'PL'})</span>
                        <span className="font-data font-extrabold text-white text-sm">
                          {formatPercentBR(s.candidato1.percentual2T)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-data">
                        <span>1ºT: {formatPercentBR(s.candidato1.percentual1T)} ({formatNumberBR(s.candidato1.votos1T)})</span>
                        <span className={`font-semibold ${
                          s.candidato1.variacaoPctPoints >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {formatDeltaPercentBR(s.candidato1.variacaoPctPoints)}
                        </span>
                      </div>
                    </div>

                    {/* Candidate 2 */}
                    <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/40">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-red-400">{s.candidato2.nome} ({s.candidato2.partido || 'PT'})</span>
                        <span className="font-data font-extrabold text-white text-sm">
                          {formatPercentBR(s.candidato2.percentual2T)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-data">
                        <span>1ºT: {formatPercentBR(s.candidato2.percentual1T)} ({formatNumberBR(s.candidato2.votos1T)})</span>
                        <span className={`font-semibold ${
                          s.candidato2.variacaoPctPoints >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {formatDeltaPercentBR(s.candidato2.variacaoPctPoints)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Abstention Snapshot */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>Abstenção:</span>
                    <div className="font-data">
                      <span className="text-slate-300">{formatPercentBR(s.percentualAbstencao1T)} ➔ {formatPercentBR(s.percentualAbstencao2T)}</span>{' '}
                      <span className={`font-bold ${
                        s.variacaoAbstencaoPctPoints > 0 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        ({formatDeltaPercentBR(s.variacaoAbstencaoPctPoints)})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Vantagem: <strong className="text-white font-data">{formatNumberBR(s.diferencaVotos2T)} votos</strong>
                  </span>
                  <button
                    onClick={() => onSelectStateDetail(s)}
                    className="px-3 py-1 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Abrir Auditoria</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
