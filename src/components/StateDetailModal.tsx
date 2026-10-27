import React from 'react';
import { X, ExternalLink, TrendingUp, CheckCircle, UserX, AlertCircle, FileText } from 'lucide-react';
import { StateComparison } from '../types/election';
import { 
  formatNumberBR, 
  formatPercentBR, 
  formatDeltaNumberBR, 
  formatDeltaPercentBR 
} from '../utils/formatters';

interface StateDetailModalProps {
  state: StateComparison | null;
  onClose: () => void;
}

export const StateDetailModal: React.FC<StateDetailModalProps> = ({ state, onClose }) => {
  if (!state) return null;

  const ufLower = state.uf.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-800 p-5 flex items-start justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-lg font-data shrink-0">
              {state.uf}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">{state.nomeEstado}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                  {state.regiao}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-data mt-0.5">
                Capital: {state.capital || '—'} · Eleitorado Apto: {formatNumberBR(state.totalEleitores)}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Sections tally */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-0.5">Seções Apuradas (2ºT)</span>
              <span className="text-base font-bold text-emerald-400 font-data">
                {formatPercentBR(state.percentualSecoes2T)}
              </span>
              <span className="text-[10px] text-slate-500 block font-data">
                {formatNumberBR(state.secoesTotalizadas2T)} seções
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-0.5">Líder Atual no Estado</span>
              <span className="text-base font-bold text-white font-data truncate block">
                {state.lider2T}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {state.houveVirada ? 'Virada em relação ao 1ºT' : 'Mesmo líder do 1º turno'}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-400 block mb-0.5">Vantagem de Votos (2ºT)</span>
              <span className="text-base font-bold text-white font-data">
                {formatNumberBR(state.diferencaVotos2T)}
              </span>
              <span className="text-[10px] text-slate-400 block font-data">
                Margem de {formatPercentBR(state.diferencaPct2T)}
              </span>
            </div>
          </div>

          {/* Virada Alert */}
          {state.houveVirada && (
            <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
              <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Virada Eleitoral:</strong> No 1º Turno o mais votado foi {state.lider1T}. No 2º Turno, {state.lider2T} assumiu a dianteira no estado!
              </span>
            </div>
          )}

          {/* Candidate Breakdown Head-to-Head */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Desempenho dos Finalistas no Estado ({state.uf})
            </h3>

            {/* Candidate 1 */}
            <div className="bg-slate-950/70 border border-blue-900/40 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-data">
                    {state.candidato1.numero}
                  </span>
                  <span className="font-bold text-white text-sm">{state.candidato1.nome} ({state.candidato1.partido})</span>
                </div>
                <span className="text-base font-bold text-blue-400 font-data">
                  {formatPercentBR(state.candidato1.percentual2T)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-data bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">1º Turno:</span>
                  <span className="font-semibold text-slate-200">{formatNumberBR(state.candidato1.votos1T)}</span>
                  <span className="text-[10px] text-slate-400 block">({formatPercentBR(state.candidato1.percentual1T)})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">2º Turno:</span>
                  <span className="font-bold text-white">{formatNumberBR(state.candidato1.votos2T)}</span>
                  <span className="text-[10px] text-blue-400 block font-semibold">({formatPercentBR(state.candidato1.percentual2T)})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Variação:</span>
                  <span className={`font-bold ${state.candidato1.variacaoPctPoints >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatDeltaPercentBR(state.candidato1.variacaoPctPoints)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {formatDeltaNumberBR(state.candidato1.variacaoVotosAbs)} votos
                  </span>
                </div>
              </div>
            </div>

            {/* Candidate 2 */}
            <div className="bg-slate-950/70 border border-red-900/40 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-red-600 text-white font-bold text-xs flex items-center justify-center font-data">
                    {state.candidato2.numero}
                  </span>
                  <span className="font-bold text-white text-sm">{state.candidato2.nome} ({state.candidato2.partido})</span>
                </div>
                <span className="text-base font-bold text-red-400 font-data">
                  {formatPercentBR(state.candidato2.percentual2T)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-data bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">1º Turno:</span>
                  <span className="font-semibold text-slate-200">{formatNumberBR(state.candidato2.votos1T)}</span>
                  <span className="text-[10px] text-slate-400 block">({formatPercentBR(state.candidato2.percentual1T)})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">2º Turno:</span>
                  <span className="font-bold text-white">{formatNumberBR(state.candidato2.votos2T)}</span>
                  <span className="text-[10px] text-red-400 block font-semibold">({formatPercentBR(state.candidato2.percentual2T)})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Variação:</span>
                  <span className={`font-bold ${state.candidato2.variacaoPctPoints >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatDeltaPercentBR(state.candidato2.variacaoPctPoints)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {formatDeltaNumberBR(state.candidato2.variacaoVotosAbs)} votos
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Abstenções, Comparecimento, Brancos e Nulos */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Estatísticas Cívicas no Estado ({state.uf})
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Abstencao */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 font-data">
                <span className="text-slate-400 block mb-1">Abstenção 1ºT ➔ 2ºT:</span>
                <div className="text-sm font-bold text-amber-400">
                  {formatPercentBR(state.percentualAbstencao1T)} ➔ {formatPercentBR(state.percentualAbstencao2T)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Variação: {formatDeltaPercentBR(state.variacaoAbstencaoPctPoints)} ({formatDeltaNumberBR(state.variacaoAbstencaoAbs)} eleitores)
                </div>
              </div>

              {/* Comparecimento */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 font-data">
                <span className="text-slate-400 block mb-1">Comparecimento 2ºT:</span>
                <div className="text-sm font-bold text-emerald-400">
                  {formatNumberBR(state.comparecimento2T)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  1ºT: {formatNumberBR(state.comparecimento1T)} compareceram
                </div>
              </div>

              {/* Brancos */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 font-data">
                <span className="text-slate-400 block mb-1">Votos em Branco:</span>
                <div className="text-sm font-bold text-slate-200">
                  {formatNumberBR(state.votosBrancos2T)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  1º Turno: {formatNumberBR(state.votosBrancos1T)}
                </div>
              </div>

              {/* Nulos */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 font-data">
                <span className="text-slate-400 block mb-1">Votos Nulos:</span>
                <div className="text-sm font-bold text-slate-200">
                  {formatNumberBR(state.votosNulos2T)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  1º Turno: {formatNumberBR(state.votosNulos1T)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-4 flex items-center justify-between">
          <a
            href={`https://resultados.tse.jus.br/oficial/app/index.html#/eleicao/6258/uf/${ufLower}/cargo/1/vis/nominal/resultados`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            <span>Ver {state.uf} no portal oficial TSE</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
