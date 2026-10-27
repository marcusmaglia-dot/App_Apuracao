import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Sparkles, Sliders, RotateCcw, 
  HelpCircle, Share2, Check, ArrowRight, Activity,
  Info, ShieldCheck
} from 'lucide-react';
import { 
  ElectionScopeTotals, 
  StateComparison, 
  SimulationParams 
} from '../types/election';
import { 
  calculateMathematicalProjection, 
  DEFAULT_SIMULATION_PARAMS 
} from '../utils/probabilityEngine';
import { 
  formatNumberBR, 
  formatPercentBR 
} from '../utils/formatters';
import { 
  saveScenario, 
  loadSavedScenarios, 
  SavedScenario,
  testFirestoreConnection
} from '../lib/scenarioService';
import { Bookmark, FolderOpen, Save, Database, Trash2 } from 'lucide-react';

interface CurvaProbabilidadeViewProps {
  t1Data: ElectionScopeTotals | null;
  t2Data: ElectionScopeTotals | null;
  states: StateComparison[];
  isLoading: boolean;
}

export const CurvaProbabilidadeView: React.FC<CurvaProbabilidadeViewProps> = ({
  t1Data,
  t2Data,
  states,
  isLoading,
}) => {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_SIMULATION_PARAMS);
  const [activeChartTab, setActiveChartTab] = useState<'probabilidade' | 'turnos'>('probabilidade');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Firebase Scenario States
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [isSavingScenario, setIsSavingScenario] = useState(false);
  const [scenarioNameInput, setScenarioNameInput] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Load scenarios on mount
  React.useEffect(() => {
    testFirestoreConnection();
    loadSavedScenarios().then(res => {
      if (res && res.length) setSavedScenarios(res);
    }).catch(console.error);
  }, []);

  // Compute projection dynamically based on parameters and current election data
  const projection = useMemo(() => {
    if (!t1Data || !t2Data) return null;
    return calculateMathematicalProjection(t1Data, t2Data, states, params);
  }, [t1Data, t2Data, states, params]);

  const handleCopyLink = () => {
    const publicUrl = 'https://ais-pre-pvqfqdgqbht7arfkehbbvp-465822566801.us-west2.run.app';
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSaveCurrentScenario = async () => {
    if (!scenarioNameInput.trim() || !projection) return;
    setIsSavingScenario(true);
    try {
      const saved = await saveScenario(
        scenarioNameInput.trim(),
        params,
        projection.candidato1.probabilidadeVitoria,
        projection.candidato2.probabilidadeVitoria
      );
      if (saved) {
        setSavedScenarios(prev => [saved, ...prev]);
        setScenarioNameInput('');
        setShowSaveModal(false);
        setSaveSuccessMsg(true);
        setTimeout(() => setSaveSuccessMsg(false), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingScenario(false);
    }
  };

  const handleLoadScenario = (scen: SavedScenario) => {
    setParams(scen.params);
  };

  if (isLoading && !t2Data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Calculando modelos de probabilidade estocástica do TSE...</p>
      </div>
    );
  }

  if (!projection || !t1Data || !t2Data) {
    return null;
  }

  const c1 = projection.candidato1;
  const c2 = projection.candidato2;
  const curPctApurado = projection.secoesApuradasPct;

  // Chart Dimensions & Coordinate Mappers
  const chartWidth = 800;
  const chartHeight = 320;
  const padding = { top: 25, right: 35, bottom: 40, left: 45 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  // Map data to SVG coordinates
  const mapX = (pct: number) => padding.left + (pct / 100) * graphWidth;
  const mapYProb = (prob: number) => padding.top + (1 - prob / 100) * graphHeight;
  
  // For Turno comparison (min 38% to max 58%)
  const minTurnoY = 38;
  const maxTurnoY = 58;
  const mapYTurno = (val: number) => padding.top + (1 - (val - minTurnoY) / (maxTurnoY - minTurnoY)) * graphHeight;

  // SVG Paths for Probability Curve
  const pathC1Prob = projection.curvaProbabilidade
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.secoesPct).toFixed(1)} ${mapYProb(p.probabilidadeC1).toFixed(1)}`)
    .join(' ');

  const pathC2Prob = projection.curvaProbabilidade
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.secoesPct).toFixed(1)} ${mapYProb(p.probabilidadeC2).toFixed(1)}`)
    .join(' ');

  // SVG Paths for Turnos Comparison
  const path1T_C1 = projection.curvaEvolucaoTurnos
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.secoesPct).toFixed(1)} ${mapYTurno(p.pct1T_C1).toFixed(1)}`)
    .join(' ');

  const path1T_C2 = projection.curvaEvolucaoTurnos
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.secoesPct).toFixed(1)} ${mapYTurno(p.pct1T_C2).toFixed(1)}`)
    .join(' ');

  const path2T_C1 = projection.curvaEvolucaoTurnos
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.secoesPct).toFixed(1)} ${mapYTurno(p.pct2T_C1).toFixed(1)}`)
    .join(' ');

  const path2T_C2 = projection.curvaEvolucaoTurnos
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.secoesPct).toFixed(1)} ${mapYTurno(p.pct2T_C2).toFixed(1)}`)
    .join(' ');

  const currentHoveredPoint = hoveredPointIndex !== null 
    ? projection.curvaProbabilidade[hoveredPointIndex] 
    : null;

  return (
    <div className="space-y-6">
      {/* Top Banner with Public Link info */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-indigo-400 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              MODELO PREDITIVO ELEITORAL
            </span>
            <span aria-hidden="true">·</span>
            <span>Urnas Pendentes Estratificadas</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-300">1ºT vs 2ºT</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Curva de Probabilidade de Vitória (Eleições 2026)
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Simulação estocástica baseada nas urnas apuradas em tempo real, ritmo histórico dos dois turnos e absorção regional dos votos de terceiros candidatos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all shadow-sm cursor-pointer whitespace-nowrap"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Público Copiado!' : 'Copiar Link Público'}</span>
          </button>
        </div>
      </div>

      {/* Main Victory Probability Odds Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Candidate 1 Probability Card */}
        <div className="bg-slate-900 border border-blue-900/40 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center font-data shadow-md">
                {c1.numero}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight leading-tight">
                  {c1.nome}
                </h3>
                <span className="text-xs text-slate-400">Partido Liberal (PL)</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block mb-0.5">Probabilidade de Vitória:</span>
              <span className="text-3xl font-extrabold text-blue-400 font-data">
                {c1.probabilidadeVitoria.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Probability Gauge Bar */}
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mb-4">
            <div 
              style={{ width: `${c1.probabilidadeVitoria}%` }}
              className="bg-blue-600 h-full rounded-full transition-all duration-700 shadow"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-data bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 block">Votação Atual (2ºT):</span>
              <span className="font-bold text-white text-sm">{formatPercentBR(c1.percentualAtual)}</span>
              <span className="text-[10px] text-slate-500 block">{formatNumberBR(c1.votosAtuais)} votos</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Projeção Final:</span>
              <span className="font-bold text-blue-400 text-sm">{formatPercentBR(c1.percentualFinalProjetado)}</span>
              <span className="text-[10px] text-slate-500 block">CI: {c1.intervaloMin}% - {c1.intervaloMax}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Falta p/ Maioria:</span>
              <span className="font-bold text-emerald-400 text-sm">{formatNumberBR(c1.votosFaltandoParaVitoria)}</span>
              <span className="text-[10px] text-slate-500 block">{c1.percentualNecessarioRestante}% dos restos</span>
            </div>
          </div>
        </div>

        {/* Candidate 2 Probability Card */}
        <div className="bg-slate-900 border border-red-900/40 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white font-bold text-lg flex items-center justify-center font-data shadow-md">
                {c2.numero}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight leading-tight">
                  {c2.nome}
                </h3>
                <span className="text-xs text-slate-400">Partido dos Trabalhadores (PT)</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block mb-0.5">Probabilidade de Vitória:</span>
              <span className="text-3xl font-extrabold text-red-400 font-data">
                {c2.probabilidadeVitoria.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Probability Gauge Bar */}
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mb-4">
            <div 
              style={{ width: `${c2.probabilidadeVitoria}%` }}
              className="bg-red-600 h-full rounded-full transition-all duration-700 shadow"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-data bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 block">Votação Atual (2ºT):</span>
              <span className="font-bold text-white text-sm">{formatPercentBR(c2.percentualAtual)}</span>
              <span className="text-[10px] text-slate-500 block">{formatNumberBR(c2.votosAtuais)} votos</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Projeção Final:</span>
              <span className="font-bold text-red-400 text-sm">{formatPercentBR(c2.percentualFinalProjetado)}</span>
              <span className="text-[10px] text-slate-500 block">CI: {c2.intervaloMin}% - {c2.intervaloMax}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Falta p/ Maioria:</span>
              <span className="font-bold text-emerald-400 text-sm">{formatNumberBR(c2.votosFaltandoParaVitoria)}</span>
              <span className="text-[10px] text-slate-500 block">{c2.percentualNecessarioRestante}% dos restos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {activeChartTab === 'probabilidade' 
                ? 'Curva Dinâmica de Probabilidade ao Longo da Totalização (0% a 100%)' 
                : 'Comparativo de Trajetória da Votação: 1º Turno vs 2º Turno'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeChartTab === 'probabilidade'
                ? 'Probabilidade estimada de vitória em função do percentual de seções totalizadas pelo TSE.'
                : 'Evolução dos percentuais válidos ao longo da chegada das urnas apuradas no 1º turno e no 2º turno.'}
            </p>
          </div>

          {/* Chart View Toggle Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveChartTab('probabilidade')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeChartTab === 'probabilidade'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Curva de Probabilidade
            </button>
            <button
              onClick={() => setActiveChartTab('turnos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeChartTab === 'turnos'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Comparativo 1ºT vs 2ºT
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs mb-3 pb-3 border-b border-slate-800/80">
          {activeChartTab === 'probabilidade' ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-500 shrink-0" />
                <span className="text-slate-300">
                  {c1.nome}: <strong className="text-blue-400 font-data">{c1.probabilidadeVitoria.toFixed(1)}%</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-red-500 shrink-0" />
                <span className="text-slate-300">
                  {c2.nome}: <strong className="text-red-400 font-data">{c2.probabilidadeVitoria.toFixed(1)}%</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-3 h-0.5 bg-dashed border-t border-slate-500 shrink-0" />
                <span>Linha de Equilíbrio (50%)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium ml-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span>Urnas Apuradas Agora: {formatPercentBR(curPctApurado)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-blue-500 shrink-0" />
                <span className="text-slate-300">{c1.nome} (2º Turno)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-red-500 shrink-0" />
                <span className="text-slate-300">{c2.nome} (2º Turno)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-blue-400/50 border-t border-dashed border-blue-400 shrink-0" />
                <span className="text-slate-400">{c1.nome} (1º Turno)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-red-400/50 border-t border-dashed border-red-400 shrink-0" />
                <span className="text-slate-400">{c2.nome} (1º Turno)</span>
              </div>
            </>
          )}
        </div>

        {/* SVG Interactive Chart Viewport */}
        <div className="relative w-full overflow-hidden bg-slate-950/60 rounded-xl p-2 border border-slate-800">
          <svg 
            viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
            className="w-full h-auto select-none"
          >
            {/* Grid Lines */}
            {[0, 25, 50, 75, 100].map(val => (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={activeChartTab === 'probabilidade' ? mapYProb(val) : mapYTurno(val)}
                  x2={chartWidth - padding.right}
                  y2={activeChartTab === 'probabilidade' ? mapYProb(val) : mapYTurno(val)}
                  stroke="#334155"
                  strokeWidth="0.75"
                  strokeDasharray={val === 50 ? '4,4' : '2,4'}
                  strokeOpacity={val === 50 ? 0.7 : 0.3}
                />
                <text
                  x={padding.left - 8}
                  y={activeChartTab === 'probabilidade' ? mapYProb(val) + 4 : mapYTurno(val) + 4}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="end"
                >
                  {val}%
                </text>
              </g>
            ))}

            {/* X-Axis checkpoints labels */}
            {[0, 20, 40, 60, 80, 100].map(val => (
              <g key={`x-${val}`}>
                <line
                  x1={mapX(val)}
                  y1={padding.top}
                  x2={mapX(val)}
                  y2={chartHeight - padding.bottom}
                  stroke="#334155"
                  strokeWidth="0.75"
                  strokeDasharray="2,4"
                  strokeOpacity="0.25"
                />
                <text
                  x={mapX(val)}
                  y={chartHeight - padding.bottom + 18}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                >
                  {val}%
                </text>
              </g>
            ))}

            {/* Shaded Area for Past vs Projected */}
            <rect
              x={padding.left}
              y={padding.top}
              width={mapX(curPctApurado) - padding.left}
              height={graphHeight}
              fill="#10b981"
              fillOpacity="0.04"
            />

            {/* Current Totalization Progress Marker Line */}
            <line
              x1={mapX(curPctApurado)}
              y1={padding.top}
              x2={mapX(curPctApurado)}
              y2={chartHeight - padding.bottom}
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="3,3"
            />
            <circle
              cx={mapX(curPctApurado)}
              y={padding.top + 6}
              r="3.5"
              fill="#10b981"
            />
            <text
              x={mapX(curPctApurado) + 5}
              y={padding.top + 10}
              fill="#10b981"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="bold"
            >
              Agora ({curPctApurado.toFixed(1)}%)
            </text>

            {/* Chart Curves Rendering */}
            {activeChartTab === 'probabilidade' ? (
              <>
                {/* 50% Benchmark horizontal line highlight */}
                <line
                  x1={padding.left}
                  y1={mapYProb(50)}
                  x2={chartWidth - padding.right}
                  y2={mapYProb(50)}
                  stroke="#64748b"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />

                {/* Candidate 1 Probability Line */}
                <path
                  d={pathC1Prob}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Candidate 2 Probability Line */}
                <path
                  d={pathC2Prob}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive points */}
                {projection.curvaProbabilidade.map((p, idx) => (
                  <g key={p.secoesPct}>
                    <circle
                      cx={mapX(p.secoesPct)}
                      y={mapYProb(p.probabilidadeC1)}
                      r={hoveredPointIndex === idx ? 5 : p.isRealizado ? 3.5 : 2.5}
                      fill="#3b82f6"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredPointIndex(idx)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                    />
                    <circle
                      cx={mapX(p.secoesPct)}
                      y={mapYProb(p.probabilidadeC2)}
                      r={hoveredPointIndex === idx ? 5 : p.isRealizado ? 3.5 : 2.5}
                      fill="#ef4444"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredPointIndex(idx)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                    />
                  </g>
                ))}
              </>
            ) : (
              <>
                {/* 1st Turno Lines (Dashed) */}
                <path
                  d={path1T_C1}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  strokeOpacity="0.7"
                />
                <path
                  d={path1T_C2}
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  strokeOpacity="0.7"
                />

                {/* 2nd Turno Lines (Solid) */}
                <path
                  d={path2T_C1}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d={path2T_C2}
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>

          {/* Interactive Tooltip Card */}
          {currentHoveredPoint && activeChartTab === 'probabilidade' && (
            <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl text-xs font-data z-10 pointer-events-none">
              <div className="text-slate-400 mb-1 border-b border-slate-800 pb-1">
                Ponto de Totalização: <strong className="text-white">{currentHoveredPoint.secoesPct}% de seções</strong>{' '}
                {currentHoveredPoint.isRealizado ? (
                  <span className="text-emerald-400 font-medium">(Já Apurado)</span>
                ) : (
                  <span className="text-indigo-400 font-medium">(Projeção)</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-4 text-blue-400 mb-0.5">
                <span>{c1.nome}:</span>
                <span className="font-bold text-white text-sm">{currentHoveredPoint.probabilidadeC1}%</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-red-400">
                <span>{c2.nome}:</span>
                <span className="font-bold text-white text-sm">{currentHoveredPoint.probabilidadeC2}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
          <span>Eixo Horizontal: Percentual de Seções Totalizadas no Brasil (0% a 100%)</span>
          <span>Eixo Vertical: Probabilidade Calculada via Modelo Estocástico de Monte Carlo</span>
        </div>
      </div>

      {/* Interactive Scenario Simulator ("E se...") */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Simulador de Sensibilidade & Transferência de Votos do 1º Turno
              </h2>
              <p className="text-xs text-slate-400">
                Ajuste os parâmetros abaixo para recalcular a curva de probabilidade e o resultado final projetado.
              </p>
            </div>
          </div>

          <button
            onClick={() => setParams(DEFAULT_SIMULATION_PARAMS)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Valores Padrão</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Slider 1: Augusto Cury */}
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-200">Augusto Cury (Avante)</span>
              <span className="font-data text-blue-400 font-bold">{params.migracaoCuryC1}% para {c1.nome.split(' ')[0]}</span>
            </div>
            <div className="text-[11px] text-slate-400 mb-2">
              1ºT: 3.448.569 votos (2,89% do total)
            </div>
            <input
              type="range"
              min="20"
              max="80"
              value={params.migracaoCuryC1}
              onChange={(e) => setParams({ ...params, migracaoCuryC1: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-data mt-1">
              <span>Mais Lula ({100 - params.migracaoCuryC1 - 8}%)</span>
              <span>Mais Flávio ({params.migracaoCuryC1}%)</span>
            </div>
          </div>

          {/* Slider 2: Renan Santos */}
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-200">Renan Santos (Missão)</span>
              <span className="font-data text-blue-400 font-bold">{params.migracaoRenanC1}% para {c1.nome.split(' ')[0]}</span>
            </div>
            <div className="text-[11px] text-slate-400 mb-2">
              1ºT: 2.675.887 votos (2,24% do total)
            </div>
            <input
              type="range"
              min="30"
              max="90"
              value={params.migracaoRenanC1}
              onChange={(e) => setParams({ ...params, migracaoRenanC1: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-data mt-1">
              <span>Mais Lula ({100 - params.migracaoRenanC1 - 7}%)</span>
              <span>Mais Flávio ({params.migracaoRenanC1}%)</span>
            </div>
          </div>

          {/* Slider 3: Ronaldo Caiado */}
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-200">Ronaldo Caiado (PSD)</span>
              <span className="font-data text-blue-400 font-bold">{params.migracaoCaiadoC1}% para {c1.nome.split(' ')[0]}</span>
            </div>
            <div className="text-[11px] text-slate-400 mb-2">
              1ºT: 2.605.148 votos (2,18% do total)
            </div>
            <input
              type="range"
              min="35"
              max="95"
              value={params.migracaoCaiadoC1}
              onChange={(e) => setParams({ ...params, migracaoCaiadoC1: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-data mt-1">
              <span>Mais Lula ({100 - params.migracaoCaiadoC1 - 6}%)</span>
              <span>Mais Flávio ({params.migracaoCaiadoC1}%)</span>
            </div>
          </div>

          {/* Slider 4: Romeu Zema */}
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-200">Romeu Zema (Novo)</span>
              <span className="font-data text-blue-400 font-bold">{params.migracaoZemaC1}% para {c1.nome.split(' ')[0]}</span>
            </div>
            <div className="text-[11px] text-slate-400 mb-2">
              1ºT: 326.488 votos (0,27% do total)
            </div>
            <input
              type="range"
              min="50"
              max="98"
              value={params.migracaoZemaC1}
              onChange={(e) => setParams({ ...params, migracaoZemaC1: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-data mt-1">
              <span>Mais Lula</span>
              <span>Mais Flávio</span>
            </div>
          </div>

          {/* Slider 5: Abstenção Nordeste */}
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-200">Variação Abstenção (Nordeste)</span>
              <span className="font-data text-amber-400 font-bold">
                {params.variacaoAbstencaoNordeste > 0 ? `+${params.variacaoAbstencaoNordeste}` : params.variacaoAbstencaoNordeste}%
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mb-2">
              Impacto sobre o comparecimento nos 9 estados da região
            </div>
            <input
              type="range"
              min="-4"
              max="6"
              step="0.5"
              value={params.variacaoAbstencaoNordeste}
              onChange={(e) => setParams({ ...params, variacaoAbstencaoNordeste: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-data mt-1">
              <span>Maior comparecimento (-4%)</span>
              <span>Maior abstenção (+6%)</span>
            </div>
          </div>

          {/* Slider 6: Abstenção Sudeste */}
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-200">Variação Abstenção (Sudeste)</span>
              <span className="font-data text-amber-400 font-bold">
                {params.variacaoAbstencaoSudeste > 0 ? `+${params.variacaoAbstencaoSudeste}` : params.variacaoAbstencaoSudeste}%
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mb-2">
              Impacto sobre SP, MG, RJ e ES (maior colégio eleitoral)
            </div>
            <input
              type="range"
              min="-4"
              max="6"
              step="0.5"
              value={params.variacaoAbstencaoSudeste}
              onChange={(e) => setParams({ ...params, variacaoAbstencaoSudeste: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-data mt-1">
              <span>Maior comparecimento (-4%)</span>
              <span>Maior abstenção (+6%)</span>
            </div>
          </div>
        </div>

        {/* Save Scenario Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Banco de Dados Firebase: <strong>gen-lang-client-0139892302</strong></span>
            {saveSuccessMsg && (
              <span className="text-emerald-400 font-semibold animate-fade-in">
                · Cenário salvo no Firebase com sucesso!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Salvar Cenário no Firebase</span>
            </button>
          </div>
        </div>

        {/* Saved Scenarios List */}
        {savedScenarios.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800/60">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
              Cenários Salvos no Firebase ({savedScenarios.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {savedScenarios.map((scen) => (
                <div
                  key={scen.id}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-2">
                    <span className="font-bold text-white block truncate">{scen.name}</span>
                    <span className="text-[11px] text-slate-400 font-data">
                      {c1.nome.split(' ')[0]}: {scen.probabilidadeResultanteC1.toFixed(1)}% · {c2.nome.split(' ')[0]}: {scen.probabilidadeResultanteC2.toFixed(1)}%
                    </span>
                  </div>
                  <button
                    onClick={() => handleLoadScenario(scen)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
                  >
                    Carregar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save Scenario Modal Dialog */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Salvar Cenário no Firebase</h3>
            <p className="text-xs text-slate-400 mb-4">
              Defina um nome para este cenário de simulação (migração de votos e abstenção) para consultá-lo quando quiser.
            </p>

            <input
              type="text"
              placeholder="Ex: Cenário Otimista Sudeste + Cury"
              value={scenarioNameInput}
              onChange={(e) => setScenarioNameInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 mb-4"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-3.5 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCurrentScenario}
                disabled={!scenarioNameInput.trim() || isSavingScenario}
                className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                {isSavingScenario ? 'Salvando...' : 'Confirmar e Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
