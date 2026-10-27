import React, { useState, useMemo } from 'react';
import { 
  UserX, Users, TrendingUp, TrendingDown, 
  ArrowUpDown, Filter, Download, AlertCircle, Info 
} from 'lucide-react';
import { ComparativeResponse } from '../types/election';
import { 
  formatNumberBR, 
  formatPercentBR, 
  formatDeltaNumberBR, 
  formatDeltaPercentBR 
} from '../utils/formatters';

interface AbstencaoViewProps {
  data: ComparativeResponse | null;
  isLoading: boolean;
}

export const AbstencaoView: React.FC<AbstencaoViewProps> = ({ data, isLoading }) => {
  const [sortField, setSortField] = useState<'abst2T' | 'abst1T' | 'deltaPct' | 'eleitores'>('abst2T');
  const [regionFilter, setRegionFilter] = useState('todas');

  const processedStates = useMemo(() => {
    if (!data || !data.estados) return [];
    let list = [...data.estados];

    if (regionFilter !== 'todas') {
      list = list.filter(s => s.regiao.toLowerCase() === regionFilter.toLowerCase());
    }

    list.sort((a, b) => {
      if (sortField === 'abst2T') return b.percentualAbstencao2T - a.percentualAbstencao2T;
      if (sortField === 'abst1T') return b.percentualAbstencao1T - a.percentualAbstencao1T;
      if (sortField === 'deltaPct') return b.variacaoAbstencaoPctPoints - a.variacaoAbstencaoPctPoints;
      if (sortField === 'eleitores') return b.totalEleitores - a.totalEleitores;
      return 0;
    });

    return list;
  }, [data, sortField, regionFilter]);

  const topAbstencao = useMemo(() => {
    if (!data || !data.estados) return [];
    return [...data.estados]
      .sort((a, b) => b.percentualAbstencao2T - a.percentualAbstencao2T)
      .slice(0, 5);
  }, [data]);

  const menorAbstencao = useMemo(() => {
    if (!data || !data.estados) return [];
    return [...data.estados]
      .filter(s => s.percentualSecoes2T > 0)
      .sort((a, b) => a.percentualAbstencao2T - b.percentualAbstencao2T)
      .slice(0, 5);
  }, [data]);

  // Export CSV
  const handleExportCSV = () => {
    if (!data || !data.estados) return;
    const headers = [
      'UF', 'Estado', 'Regiao', 'Eleitorado', 'Abstencao_1T_Abs', 'Abstencao_1T_Pct',
      'Abstencao_2T_Abs', 'Abstencao_2T_Pct', 'Variacao_Absoluta', 'Variacao_Pct_Points'
    ];

    const rows = data.estados.map(s => [
      s.uf,
      `"${s.nomeEstado}"`,
      s.regiao,
      s.totalEleitores,
      s.abstencao1T,
      `${s.percentualAbstencao1T}%`,
      s.abstencao2T,
      `${s.percentualAbstencao2T}%`,
      s.variacaoAbstencaoAbs,
      s.variacaoAbstencaoPctPoints
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(',')), ...[['Brasil', '"Total Nacional"', 'BR', data.totaisBrasil.turno1.totalEleitores, data.totaisBrasil.turno1.abstencao, `${data.totaisBrasil.turno1.percentualAbstencao}%`, data.totaisBrasil.turno2.abstencao, `${data.totaisBrasil.turno2.percentualAbstencao}%`, data.totaisBrasil.variacaoAbstencaoAbs, data.totaisBrasil.variacaoAbstencaoPctPoints]]].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tse-eleicoes-2026-abstencoes.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Processando estatísticas de abstenção eleitoral...</p>
      </div>
    );
  }

  if (!data) return null;

  const t1 = data.totaisBrasil.turno1;
  const t2 = data.totaisBrasil.turno2;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Justiça Eleitoral</span>
            <span aria-hidden="true">·</span>
            <span>Métricas de Participação Cívica</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-400 font-medium">Abstenções, Comparecimento & Deserção</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Análise Aprofundada da Abstenção Eleitoral (1ºT vs 2ºT)
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Monitore o comportamento do eleitorado apto em todo o Brasil. Veja em quais estados o comparecimento aumentou ou diminuiu entre os pleitos.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-sm shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Relatório de Abstenções</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Abstencao 1T */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Abstenção 1º Turno (Final)</span>
            <UserX className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white font-data">
            {formatPercentBR(t1.percentualAbstencao)}
          </div>
          <div className="text-xs text-slate-400 font-data mt-1">
            {formatNumberBR(t1.abstencao)} de {formatNumberBR(t1.totalEleitores)} eleitores
          </div>
        </div>

        {/* Abstencao 2T */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Abstenção 2º Turno (Parcial)</span>
            <UserX className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-data">
            {formatPercentBR(t2.percentualAbstencao)}
          </div>
          <div className="text-xs text-slate-400 font-data mt-1">
            {formatNumberBR(t2.abstencao)} registrados até o momento
          </div>
        </div>

        {/* Delta */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Oscilação Geral de Abstenção</span>
            {data.totaisBrasil.variacaoAbstencaoPctPoints > 0 ? (
              <TrendingUp className="w-4 h-4 text-amber-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className={`text-2xl font-bold font-data ${
            data.totaisBrasil.variacaoAbstencaoPctPoints > 0 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {formatDeltaPercentBR(data.totaisBrasil.variacaoAbstencaoPctPoints)}
          </div>
          <div className="text-xs text-slate-400 font-data mt-1">
            {formatDeltaNumberBR(data.totaisBrasil.variacaoAbstencaoAbs)} eleitores em relação ao 1ºT
          </div>
        </div>

        {/* Comparecimento */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Taxa de Comparecimento</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-data">
            {formatPercentBR(t2.percentualComparecimento)}
          </div>
          <div className="text-xs text-slate-400 font-data mt-1">
            1ºT: {formatPercentBR(t1.percentualComparecimento)} compareceram
          </div>
        </div>
      </div>

      {/* Top 5 Extremes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top 5 Maior Abstenção */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Estados com Maior Taxa de Abstenção (2º Turno)
          </h3>
          <div className="space-y-2">
            {topAbstencao.map((s, idx) => (
              <div key={s.uf} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="font-data font-bold text-slate-500">#{idx + 1}</span>
                  <span className="font-data font-bold px-1.5 py-0.5 rounded bg-slate-800 text-white text-[11px]">
                    {s.uf}
                  </span>
                  <span className="text-slate-200 font-medium">{s.nomeEstado}</span>
                </div>
                <div className="text-right font-data">
                  <span className="font-bold text-amber-400 text-sm">{formatPercentBR(s.percentualAbstencao2T)}</span>{' '}
                  <span className="text-slate-500 text-[11px]">({formatDeltaPercentBR(s.variacaoAbstencaoPctPoints)})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Menor Abstenção (Maior engajamento) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Estados com Menor Taxa de Abstenção (Maior Mobilização)
          </h3>
          <div className="space-y-2">
            {menorAbstencao.map((s, idx) => (
              <div key={s.uf} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="font-data font-bold text-slate-500">#{idx + 1}</span>
                  <span className="font-data font-bold px-1.5 py-0.5 rounded bg-slate-800 text-white text-[11px]">
                    {s.uf}
                  </span>
                  <span className="text-slate-200 font-medium">{s.nomeEstado}</span>
                </div>
                <div className="text-right font-data">
                  <span className="font-bold text-emerald-400 text-sm">{formatPercentBR(s.percentualAbstencao2T)}</span>{' '}
                  <span className="text-slate-500 text-[11px]">({formatDeltaPercentBR(s.variacaoAbstencaoPctPoints)})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Complete State Abstention Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Quadro Completo de Abstenções por Estado</h3>
            <span className="text-xs text-slate-400 font-data">({processedStates.length} UFs)</span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="todas" className="bg-slate-800 text-slate-200">Todas as Regiões</option>
                <option value="sudeste" className="bg-slate-800 text-slate-200">Sudeste</option>
                <option value="nordeste" className="bg-slate-800 text-slate-200">Nordeste</option>
                <option value="sul" className="bg-slate-800 text-slate-200">Sul</option>
                <option value="norte" className="bg-slate-800 text-slate-200">Norte</option>
                <option value="centro-oeste" className="bg-slate-800 text-slate-200">Centro-Oeste</option>
                <option value="exterior" className="bg-slate-800 text-slate-200">Exterior</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as any)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="abst2T" className="bg-slate-800 text-slate-200">Maior Abstenção 2ºT</option>
                <option value="abst1T" className="bg-slate-800 text-slate-200">Maior Abstenção 1ºT</option>
                <option value="deltaPct" className="bg-slate-800 text-slate-200">Maior Aumento de Abstenção</option>
                <option value="eleitores" className="bg-slate-800 text-slate-200">Maior Eleitorado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">UF</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Região</th>
                <th className="py-3 px-4 text-right">Eleitorado Total</th>
                <th className="py-3 px-4 text-right">Abstenção 1º Turno</th>
                <th className="py-3 px-4 text-right">Abstenção 2º Turno</th>
                <th className="py-3 px-4 text-right">Variação (p.p.)</th>
                <th className="py-3 px-4 text-right">Saldo de Ausentes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {processedStates.map((s) => (
                <tr key={s.uf} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-data font-bold px-2 py-0.5 rounded bg-slate-800 text-white text-xs border border-slate-700">
                      {s.uf}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">
                    {s.nomeEstado}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {s.regiao}
                  </td>
                  <td className="py-3 px-4 text-right font-data text-slate-300">
                    {formatNumberBR(s.totalEleitores)}
                  </td>
                  <td className="py-3 px-4 text-right font-data">
                    <div className="font-semibold text-white">{formatPercentBR(s.percentualAbstencao1T)}</div>
                    <div className="text-[11px] text-slate-500">{formatNumberBR(s.abstencao1T)}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-data">
                    <div className="font-bold text-amber-400">{formatPercentBR(s.percentualAbstencao2T)}</div>
                    <div className="text-[11px] text-slate-500">{formatNumberBR(s.abstencao2T)}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-data font-bold">
                    <span className={s.variacaoAbstencaoPctPoints > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                      {formatDeltaPercentBR(s.variacaoAbstencaoPctPoints)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-data font-semibold">
                    <span className={s.variacaoAbstencaoAbs > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                      {formatDeltaNumberBR(s.variacaoAbstencaoAbs)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
