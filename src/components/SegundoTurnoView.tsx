import React, { useState, useMemo } from 'react';
import { 
  Users, CheckCircle2, UserX, AlertCircle, 
  ExternalLink, ArrowRight, TrendingUp, ShieldAlert,
  Percent, BarChart3, Filter
} from 'lucide-react';
import { ElectionScopeTotals } from '../types/election';
import { formatNumberBR, formatPercentBR } from '../utils/formatters';
import { BRAZIL_STATES, getCandidateColor } from '../utils/states';

interface SegundoTurnoViewProps {
  data: ElectionScopeTotals | null;
  stateData: Record<string, ElectionScopeTotals>;
  isLoading: boolean;
  onNavigateToComparative: () => void;
  onSelectStateDetail?: (uf: string) => void;
}

export const SegundoTurnoView: React.FC<SegundoTurnoViewProps> = ({
  data,
  stateData,
  isLoading,
  onNavigateToComparative,
  onSelectStateDetail,
}) => {
  const [selectedScope, setSelectedScope] = useState<string>('br');

  const currentData = useMemo(() => {
    if (selectedScope === 'br') return data;
    return stateData[selectedScope] || data;
  }, [selectedScope, data, stateData]);

  // Explicitly identify candidates by ballot number:
  // 22: Flávio Bolsonaro (PL)
  // 13: Lula (PT)
  const candFlavio = currentData?.candidatos?.find(c => c.numero === '22') || currentData?.candidatos?.[0] || {
    numero: '22',
    nomeUrna: 'FLAVIO BOLSONARO',
    partidoSigla: 'PL',
    partidoNome: 'PARTIDO LIBERAL',
    votosApurados: 0,
    percentual: 0
  };

  const candLula = currentData?.candidatos?.find(c => c.numero === '13') || currentData?.candidatos?.[1] || {
    numero: '13',
    nomeUrna: 'LULA',
    partidoSigla: 'PT',
    partidoNome: 'PARTIDO DOS TRABALHADORES',
    votosApurados: 0,
    percentual: 0
  };

  const diffVotos = useMemo(() => {
    return Math.abs(candFlavio.votosApurados - candLula.votosApurados);
  }, [candFlavio, candLula]);

  const diffPct = useMemo(() => {
    return Math.abs(candFlavio.percentual - candLula.percentual);
  }, [candFlavio, candLula]);

  // Compute remaining estimated votes to count
  const estimatedVotesRemaining = useMemo(() => {
    if (!currentData) return 0;
    if (currentData.percentualSecoes >= 100) return 0;
    if (currentData.percentualSecoes === 0) return currentData.totalEleitores;
    const estimatedTotal = currentData.totalVotos / (currentData.percentualSecoes / 100);
    return Math.max(0, Math.round(estimatedTotal - currentData.totalVotos));
  }, [currentData]);

  if (isLoading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Conectando aos servidores do TSE (Pleito 6258 - 2º Turno)...</p>
      </div>
    );
  }

  if (!currentData || !candFlavio || !candLula) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">Aguardando Dados do 2º Turno</h3>
        <p className="text-sm text-slate-400 mt-1">
          Os dados do pleito 6258 do TSE estão sendo inicializados.
        </p>
      </div>
    );
  }

  const colorFlavio = getCandidateColor('22');
  const colorLula = getCandidateColor('13');

  const flavioIsLeading = candFlavio.votosApurados > candLula.votosApurados;
  const lulaIsLeading = candLula.votosApurados > candFlavio.votosApurados;

  return (
    <div className="space-y-6">
      {/* Live Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              APURAÇÃO AO VIVO
            </span>
            <span aria-hidden="true">·</span>
            <span>Eleição ID 6258</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-300">2º Turno Presidencial</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Apuração em Tempo Real: Eleições 2026 (2º Turno)
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Acompanhe voto a voto a disputa presidencial entre os dois candidatos classificados: Flávio Bolsonaro (PL) e Lula (PT), com dados transmitidos diretamente do Tribunal Superior Eleitoral.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="https://resultados.tse.jus.br/oficial/app/index.html#/eleicao/6258/uf/br/cargo/1/vis/nominal/resultados"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            <span>Ver no TSE Oficial</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onNavigateToComparative}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <span>Ver Comparativo por Estado</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scope Selector */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-1 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Filtrar Território:
          </span>
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-xs font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="br">Brasil (Totalização Nacional)</option>
            <optgroup label="Estados Brasileiros">
              {Object.entries(BRAZIL_STATES).map(([code, s]) => (
                <option key={code} value={code}>
                  {s.uf} - {s.nome} ({s.regiao})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div>
            Seções Apuradas:{' '}
            <strong className="text-white font-data">{formatPercentBR(currentData.percentualSecoes)}</strong>{' '}
            ({formatNumberBR(currentData.secoesTotalizadas)} de {formatNumberBR(currentData.totalSecoes)})
          </div>
          <span aria-hidden="true">·</span>
          <div>
            Atualizado:{' '}
            <span className="text-slate-200 font-data">
              {currentData.dataHoraTotalizacao || currentData.dataHoraGeracao}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Duel Battle Arena Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Progress bar of section tally at top */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Ritmo de Totalização das Seções Eleitorais
            </span>
            <span className="font-data text-white font-bold text-sm">
              {formatPercentBR(currentData.percentualSecoes)}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              style={{ width: `${currentData.percentualSecoes}%` }}
              className="bg-gradient-to-r from-emerald-500 to-blue-500 h-full rounded-full transition-all duration-700 shadow-sm"
            />
          </div>
        </div>

        {/* 2-Column Duel Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {/* Flávio Bolsonaro (PL - 22) */}
          <div className={`p-5 rounded-2xl border transition-all ${
            flavioIsLeading
              ? 'bg-blue-950/20 border-blue-500/40 shadow-lg'
              : 'bg-slate-950/40 border-slate-800'
          }`}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: colorFlavio.primary }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl font-data shadow-md shrink-0"
                >
                  22
                </div>
                <div>
                  <div className="text-xl font-bold text-white tracking-tight">
                    {candFlavio.nomeUrna || 'FLAVIO BOLSONARO'}
                  </div>
                  <div className="text-xs text-slate-400">
                    <span className="font-bold text-blue-400">PL</span> · PARTIDO LIBERAL
                  </div>
                </div>
              </div>

              {flavioIsLeading && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Na Liderança
                </span>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <div className="text-xs text-slate-400 mb-1">Percentual Votos Válidos:</div>
              <div className="text-3xl lg:text-4xl font-extrabold text-blue-400 font-data mb-2">
                {formatPercentBR(candFlavio.percentual)}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Votos Nominais:</span>
                <span className="font-data font-bold text-white text-base">
                  {formatNumberBR(candFlavio.votosApurados)}
                </span>
              </div>
            </div>
          </div>

          {/* Lula (PT - 13) */}
          <div className={`p-5 rounded-2xl border transition-all ${
            lulaIsLeading
              ? 'bg-red-950/20 border-red-500/40 shadow-lg'
              : 'bg-slate-950/40 border-slate-800'
          }`}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: colorLula.primary }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl font-data shadow-md shrink-0"
                >
                  13
                </div>
                <div>
                  <div className="text-xl font-bold text-white tracking-tight">
                    {candLula.nomeUrna || 'LULA'}
                  </div>
                  <div className="text-xs text-slate-400">
                    <span className="font-bold text-red-400">PT</span> · PARTIDO DOS TRABALHADORES
                  </div>
                </div>
              </div>

              {lulaIsLeading && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Na Liderança
                </span>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <div className="text-xs text-slate-400 mb-1">Percentual Votos Válidos:</div>
              <div className="text-3xl lg:text-4xl font-extrabold text-red-400 font-data mb-2">
                {formatPercentBR(candLula.percentual)}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Votos Nominais:</span>
                <span className="font-data font-bold text-white text-base">
                  {formatNumberBR(candLula.votosApurados)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tug-of-war visual bar */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold text-blue-400">{candFlavio.nomeUrna} ({formatPercentBR(candFlavio.percentual)})</span>
            <div className="text-center font-semibold text-slate-300 text-xs bg-slate-800 px-3 py-0.5 rounded-full">
              Diferença: <span className="font-data text-white">{formatNumberBR(diffVotos)} votos</span> ({diffPct.toFixed(2)} p.p.)
            </div>
            <span className="font-bold text-red-400">{candLula.nomeUrna} ({formatPercentBR(candLula.percentual)})</span>
          </div>

          <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex relative">
            <div
              style={{ width: `${candFlavio.percentual}%` }}
              className="bg-blue-600 transition-all duration-500"
            />
            <div
              style={{ width: `${candLula.percentual}%` }}
              className="bg-red-600 transition-all duration-500"
            />
            {/* Center 50% line marker */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-white/60 shadow" />
          </div>
          <div className="flex justify-center text-[11px] text-slate-500 mt-1">
            <span>Marco de Maioria Absoluta (50% + 1 voto)</span>
          </div>
        </div>
      </div>

      {/* 2º Turno Complementary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Votos Válidos Totais</div>
          <div className="text-lg font-bold text-white font-data">
            {formatNumberBR(currentData.votosValidos)}
          </div>
          <div className="text-[11px] text-slate-400 font-data mt-0.5">
            {formatPercentBR(currentData.percentualValidos)} dos votos apurados
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Abstenção Registrada</div>
          <div className="text-lg font-bold text-amber-400 font-data">
            {formatNumberBR(currentData.abstencao)}
          </div>
          <div className="text-[11px] text-amber-400/90 font-data mt-0.5">
            {formatPercentBR(currentData.percentualAbstencao)} do eleitorado
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Brancos & Nulos</div>
          <div className="text-lg font-bold text-slate-300 font-data">
            {formatNumberBR(currentData.votosBrancos + currentData.votosNulos)}
          </div>
          <div className="text-[11px] text-slate-400 font-data mt-0.5">
            Brancos: {formatPercentBR(currentData.percentualBrancos)} · Nulos: {formatPercentBR(currentData.percentualNulos)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Votos Estimados a Apurar</div>
          <div className="text-lg font-bold text-emerald-400 font-data">
            {formatNumberBR(estimatedVotesRemaining)}
          </div>
          <div className="text-[11px] text-slate-400 font-data mt-0.5">
            Com base em {formatPercentBR(currentData.percentualSecoes)} apurados
          </div>
        </div>
      </div>
    </div>
  );
};
