import React, { useState, useMemo } from 'react';
import { 
  Users, CheckCircle2, UserX, AlertCircle, FileText, 
  ExternalLink, Search, ArrowUpDown, LayoutGrid, Table as TableIcon,
  Download, Filter, ChevronRight
} from 'lucide-react';
import { ElectionScopeTotals, CandidateResult } from '../types/election';
import { formatNumberBR, formatPercentBR } from '../utils/formatters';
import { BRAZIL_STATES, getCandidateColor } from '../utils/states';

interface PrimeiroTurnoViewProps {
  data: ElectionScopeTotals | null;
  stateData: Record<string, ElectionScopeTotals>;
  isLoading: boolean;
  onSelectStateDetail?: (uf: string) => void;
}

export const PrimeiroTurnoView: React.FC<PrimeiroTurnoViewProps> = ({
  data,
  stateData,
  isLoading,
  onSelectStateDetail,
}) => {
  const [selectedScope, setSelectedScope] = useState<string>('br');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortBy, setSortBy] = useState<'votos' | 'percentual' | 'numero' | 'nome'>('votos');

  const currentData = useMemo(() => {
    if (selectedScope === 'br') return data;
    return stateData[selectedScope] || data;
  }, [selectedScope, data, stateData]);

  const filteredCandidates = useMemo(() => {
    if (!currentData || !currentData.candidatos) return [];
    let list = [...currentData.candidatos];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        c => c.nomeUrna.toLowerCase().includes(q) ||
             c.nomeCompleto.toLowerCase().includes(q) ||
             c.partidoSigla.toLowerCase().includes(q) ||
             c.numero.includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'votos') return b.votosApurados - a.votosApurados;
      if (sortBy === 'percentual') return b.percentual - a.percentual;
      if (sortBy === 'numero') return parseInt(a.numero, 10) - parseInt(b.numero, 10);
      if (sortBy === 'nome') return a.nomeUrna.localeCompare(b.nomeUrna);
      return 0;
    });

    return list;
  }, [currentData, searchQuery, sortBy]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!currentData) return;
    const headers = ['Numero', 'Candidato', 'Nome Completo', 'Partido', 'Votos Absolutos', 'Percentual', 'Situacao'];
    const rows = currentData.candidatos.map(c => [
      c.numero,
      `"${c.nomeUrna}"`,
      `"${c.nomeCompleto}"`,
      c.partidoSigla,
      c.votosApurados,
      `${c.percentual}%`,
      c.situacao || 'Não eleito'
    ]);
    const summaryRows = [
      [],
      ['Total Eleitores', currentData.totalEleitores],
      ['Comparecimento', currentData.comparecimento, `${currentData.percentualComparecimento}%`],
      ['Abstencao', currentData.abstencao, `${currentData.percentualAbstencao}%`],
      ['Votos Validos', currentData.votosValidos, `${currentData.percentualValidos}%`],
      ['Votos Brancos', currentData.votosBrancos, `${currentData.percentualBrancos}%`],
      ['Votos Nulos', currentData.votosNulos, `${currentData.percentualNulos}%`],
      ['Secoes Totalizadas', currentData.secoesTotalizadas, `${currentData.percentualSecoes}%`],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(',')), ...summaryRows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tse-eleicoes-2026-1turno-${selectedScope}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Carregando dados de totalização do 1º Turno (TSE)...</p>
      </div>
    );
  }

  if (!currentData) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">Dados do 1º Turno Indisponíveis</h3>
        <p className="text-sm text-slate-400 mt-1">
          Não foi possível sincronizar os dados do TSE neste instante. Tente atualizar novamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Institutional Banner & Source Link */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Justiça Eleitoral</span>
            <span aria-hidden="true">·</span>
            <span>Eleição Geral Federal 2026</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-medium">1º Turno Consolidado (100% Apurado)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Resultado da Totalização para Presidente da República
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Votação nominal completa de todos os candidatos presidenciais, abstenção e distribuição de sufrágios apurados nas urnas eletrônicas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="https://evolucao-totalizacao.tse.jus.br/painel/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>Painel Oficial do TSE</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Scope Selector: Brasil vs Estados */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-1 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Abrangência Geográfica:
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

        <div className="text-xs text-slate-400">
          Última totalização TSE:{' '}
          <span className="text-slate-200 font-data">
            {currentData.dataHoraTotalizacao || currentData.dataHoraGeracao}
          </span>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Eleitorado Total */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Eleitorado Apto</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-lg lg:text-xl font-bold text-white font-data">
            {formatNumberBR(currentData.totalEleitores)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">100% dos eleitores cadastrados</div>
        </div>

        {/* Comparecimento */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Comparecimento</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg lg:text-xl font-bold text-emerald-400 font-data">
            {formatNumberBR(currentData.comparecimento)}
          </div>
          <div className="text-[11px] text-emerald-400/90 font-data mt-1">
            {formatPercentBR(currentData.percentualComparecimento)} do eleitorado
          </div>
        </div>

        {/* Abstenções */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Abstenções</span>
            <UserX className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg lg:text-xl font-bold text-amber-400 font-data">
            {formatNumberBR(currentData.abstencao)}
          </div>
          <div className="text-[11px] text-amber-400/90 font-data mt-1">
            {formatPercentBR(currentData.percentualAbstencao)} não compareceram
          </div>
        </div>

        {/* Votos Válidos */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Votos Válidos</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg lg:text-xl font-bold text-blue-400 font-data">
            {formatNumberBR(currentData.votosValidos)}
          </div>
          <div className="text-[11px] text-blue-400/90 font-data mt-1">
            {formatPercentBR(currentData.percentualValidos)} dos votos apurados
          </div>
        </div>

        {/* Brancos & Nulos */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Brancos e Nulos</span>
            <AlertCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg lg:text-xl font-bold text-slate-300 font-data">
            {formatNumberBR(currentData.votosBrancos + currentData.votosNulos)}
          </div>
          <div className="text-[11px] text-slate-400 font-data mt-1">
            Brancos: {formatPercentBR(currentData.percentualBrancos)} · Nulos: {formatPercentBR(currentData.percentualNulos)}
          </div>
        </div>

        {/* Seções Totalizadas */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Seções Apuradas</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-lg lg:text-xl font-bold text-white font-data">
            {formatPercentBR(currentData.percentualSecoes)}
          </div>
          <div className="text-[11px] text-slate-400 font-data mt-1">
            {formatNumberBR(currentData.secoesTotalizadas)} de {formatNumberBR(currentData.totalSecoes)}
          </div>
        </div>
      </div>

      {/* Proportional Vote Composition Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-semibold text-slate-300">Composição do Eleitorado (Comparecimento vs Abstenção)</span>
          <span className="font-data">Total: {formatNumberBR(currentData.totalEleitores)}</span>
        </div>

        {/* Progress Bar */}
        <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${currentData.percentualComparecimento * (currentData.percentualValidos / 100)}%` }}
            className="bg-blue-600 transition-all duration-500"
            title={`Votos Válidos: ${formatNumberBR(currentData.votosValidos)}`}
          />
          <div
            style={{ width: `${currentData.percentualComparecimento * (currentData.percentualBrancos / 100)}%` }}
            className="bg-slate-400 transition-all duration-500"
            title={`Votos Brancos: ${formatNumberBR(currentData.votosBrancos)}`}
          />
          <div
            style={{ width: `${currentData.percentualComparecimento * (currentData.percentualNulos / 100)}%` }}
            className="bg-slate-600 transition-all duration-500"
            title={`Votos Nulos: ${formatNumberBR(currentData.votosNulos)}`}
          />
          <div
            style={{ width: `${currentData.percentualAbstencao}%` }}
            className="bg-amber-600/80 transition-all duration-500"
            title={`Abstenções: ${formatNumberBR(currentData.abstencao)}`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-600 shrink-0" />
            <span className="text-slate-300">
              Válidos: <strong className="text-white font-data">{formatPercentBR(currentData.percentualValidos)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-slate-400 shrink-0" />
            <span className="text-slate-300">
              Brancos: <strong className="text-white font-data">{formatPercentBR(currentData.percentualBrancos)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-slate-600 shrink-0" />
            <span className="text-slate-300">
              Nulos: <strong className="text-white font-data">{formatPercentBR(currentData.percentualNulos)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-600/80 shrink-0" />
            <span className="text-slate-300">
              Abstenção: <strong className="text-amber-400 font-data">{formatPercentBR(currentData.percentualAbstencao)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Candidate List Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Votação Nominal dos Candidatos a Presidente
          </h2>
          <span className="text-xs text-slate-400 font-data">
            ({filteredCandidates.length} candidatos)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar candidato ou partido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full sm:w-56"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="votos" className="bg-slate-900 text-slate-200">Mais Votados</option>
              <option value="percentual" className="bg-slate-900 text-slate-200">Maior %</option>
              <option value="numero" className="bg-slate-900 text-slate-200">Número de Urna</option>
              <option value="nome" className="bg-slate-900 text-slate-200">Nome (A-Z)</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('cards')}
              title="Visualização em Cartões"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'cards' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Visualização em Tabela"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Render View: Cards or Table */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map((cand, index) => {
            const colors = getCandidateColor(cand.numero);
            const isTop2 = index < 2 && currentData.abrangencia === 'br';

            return (
              <div
                key={cand.numero}
                className={`bg-slate-900/90 border rounded-2xl p-5 flex flex-col justify-between transition-all relative overflow-hidden ${
                  cand.situacao.includes('2º turno') || isTop2
                    ? 'border-blue-500/60 shadow-lg shadow-blue-950/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top status & badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {/* Urna number avatar */}
                    <div 
                      style={{ backgroundColor: colors.primary }}
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg font-data shadow-md shrink-0"
                    >
                      {cand.numero}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white tracking-tight">
                          {cand.nomeUrna}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">{cand.partidoSigla}</span>
                        {cand.federacao && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-[150px]">{cand.federacao}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  {cand.situacao && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      cand.situacao.includes('2º turno')
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {cand.situacao}
                    </span>
                  )}
                </div>

                {/* Candidate detailed info */}
                <div className="text-xs text-slate-400 space-y-1 mb-4">
                  <div>Nome: <span className="text-slate-300">{cand.nomeCompleto}</span></div>
                  {cand.vice && (
                    <div>Vice: <span className="text-slate-300">{cand.vice}</span></div>
                  )}
                </div>

                {/* Quantitative results */}
                <div className="pt-3 border-t border-slate-800/80">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xs text-slate-400">Total de Votos:</span>
                    <span className="text-sm font-bold text-white font-data">
                      {formatNumberBR(cand.votosApurados)}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs text-slate-400">Percentual dos Válidos:</span>
                    <span className="text-xl font-bold font-data" style={{ color: colors.border }}>
                      {formatPercentBR(cand.percentual)}
                    </span>
                  </div>

                  {/* Proportional candidate bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(cand.percentual, 100)}%`, backgroundColor: colors.primary }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Full Data Table */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Pos</th>
                  <th className="py-3 px-4">Nº</th>
                  <th className="py-3 px-4">Candidato na Urna</th>
                  <th className="py-3 px-4">Partido / Federação</th>
                  <th className="py-3 px-4">Vice</th>
                  <th className="py-3 px-4 text-right">Votos Absolutos</th>
                  <th className="py-3 px-4 text-right">% Votos Válidos</th>
                  <th className="py-3 px-4 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredCandidates.map((cand, idx) => {
                  const colors = getCandidateColor(cand.numero);
                  return (
                    <tr key={cand.numero} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-data text-slate-400 font-semibold">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4 font-data font-bold">
                        <span 
                          style={{ backgroundColor: colors.primary }}
                          className="px-2 py-0.5 rounded text-white text-[11px]"
                        >
                          {cand.numero}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{cand.nomeUrna}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{cand.nomeCompleto}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">{cand.partidoSigla}</div>
                        <div className="text-[11px] text-slate-400">{cand.partidoNome}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {cand.vice || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-data font-semibold text-white">
                        {formatNumberBR(cand.votosApurados)}
                      </td>
                      <td className="py-3 px-4 text-right font-data font-bold text-sm" style={{ color: colors.border }}>
                        {formatPercentBR(cand.percentual)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          cand.situacao.includes('2º turno')
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {cand.situacao || 'Não eleito'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
