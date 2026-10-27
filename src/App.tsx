import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PrimeiroTurnoView } from './components/PrimeiroTurnoView';
import { SegundoTurnoView } from './components/SegundoTurnoView';
import { ComparativoEstadosView } from './components/ComparativoEstadosView';
import { AbstencaoView } from './components/AbstencaoView';
import { CurvaProbabilidadeView } from './components/CurvaProbabilidadeView';
import { StateDetailModal } from './components/StateDetailModal';
import { ElectionScopeTotals, ComparativeResponse, StateComparison } from './types/election';
import { ExternalLink, ShieldCheck, Database, RefreshCw, AlertCircle, Share2, Check } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'1turno' | '2turno' | 'comparativo' | 'probabilidade' | 'abstencao'>('probabilidade');
  
  // Election Data
  const [turno1BR, setTurno1BR] = useState<ElectionScopeTotals | null>(null);
  const [turno1States, setTurno1States] = useState<Record<string, ElectionScopeTotals>>({});
  
  const [turno2BR, setTurno2BR] = useState<ElectionScopeTotals | null>(null);
  const [turno2States, setTurno2States] = useState<Record<string, ElectionScopeTotals>>({});
  
  const [comparativoData, setComparativoData] = useState<ComparativeResponse | null>(null);

  // Status & Refresh
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30); // 30 seconds default

  // Selected State Detail Modal
  const [selectedStateDetail, setSelectedStateDetail] = useState<StateComparison | null>(null);
  const [copiedPublicUrl, setCopiedPublicUrl] = useState(false);

  // Fetch all datasets
  const fetchAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    setErrorMessage(null);

    try {
      // Fetch concurrently from backend proxy
      const [res1T, res2T, resComp] = await Promise.all([
        fetch('/api/eleicao/primeiro-turno'),
        fetch('/api/eleicao/segundo-turno'),
        fetch('/api/eleicao/comparativo'),
      ]);

      if (!res1T.ok || !res2T.ok || !resComp.ok) {
        throw new Error('Falha ao obter resposta dos serviços de apuração do TSE');
      }

      const [data1T, data2T, dataComp] = await Promise.all([
        res1T.json(),
        res2T.json(),
        resComp.json(),
      ]);

      if (data1T.brasil) {
        setTurno1BR(data1T.brasil);
        setTurno1States(data1T.estados || {});
      }

      if (data2T.brasil) {
        setTurno2BR(data2T.brasil);
        setTurno2States(data2T.estados || {});
      }

      if (dataComp) {
        setComparativoData(dataComp);
      }

      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } catch (err: any) {
      console.error('Error fetching election data:', err);
      setErrorMessage(err.message || 'Erro ao sincronizar com os servidores do TSE');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      fetchAllData(true);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchAllData]);

  return (
    <div className="min-h-screen bg-[#090e17] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchAllData(false)}
        lastUpdated={lastUpdated}
        autoRefreshInterval={autoRefreshInterval}
        setAutoRefreshInterval={setAutoRefreshInterval}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {/* Public Deployment URL Banner */}
        <div className="mb-5 px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="font-semibold text-white">Aplicação Pública Online:</span>
            <span className="font-data text-slate-400 truncate max-w-xs sm:max-w-md">
              https://ais-pre-pvqfqdgqbht7arfkehbbvp-465822566801.us-west2.run.app
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                navigator.clipboard.writeText('https://ais-pre-pvqfqdgqbht7arfkehbbvp-465822566801.us-west2.run.app');
                setCopiedPublicUrl(true);
                setTimeout(() => setCopiedPublicUrl(false), 3000);
              }}
              className="px-2.5 py-1 text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors font-medium flex items-center gap-1 cursor-pointer"
            >
              {copiedPublicUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3 text-indigo-400" />}
              <span>{copiedPublicUrl ? 'Copiado!' : 'Copiar Link'}</span>
            </button>
            <a
              href="https://ais-pre-pvqfqdgqbht7arfkehbbvp-465822566801.us-west2.run.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors font-medium flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3 text-blue-400" />
              <span>Abrir no Navegador</span>
            </a>
          </div>
        </div>

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}. Tentando recuperar dados em cache do TSE...</span>
            </div>
            <button
              onClick={() => fetchAllData(false)}
              className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white rounded font-medium cursor-pointer"
            >
              Reconectar
            </button>
          </div>
        )}

        {/* Tab 1: 1º Turno Dashboard */}
        {activeTab === '1turno' && (
          <PrimeiroTurnoView
            data={turno1BR}
            stateData={turno1States}
            isLoading={isLoading}
            onSelectStateDetail={(uf) => {
              const stateComp = comparativoData?.estados?.find(s => s.uf.toLowerCase() === uf.toLowerCase());
              if (stateComp) setSelectedStateDetail(stateComp);
            }}
          />
        )}

        {/* Tab 2: 2º Turno Dashboard (Ao Vivo) */}
        {activeTab === '2turno' && (
          <SegundoTurnoView
            data={turno2BR}
            stateData={turno2States}
            isLoading={isLoading}
            onNavigateToComparative={() => setActiveTab('comparativo')}
            onSelectStateDetail={(uf) => {
              const stateComp = comparativoData?.estados?.find(s => s.uf.toLowerCase() === uf.toLowerCase());
              if (stateComp) setSelectedStateDetail(stateComp);
            }}
          />
        )}

        {/* Tab 3: Comparativo 1ºT vs 2ºT por Estado */}
        {activeTab === 'comparativo' && (
          <ComparativoEstadosView
            data={comparativoData}
            isLoading={isLoading}
            onSelectStateDetail={(state) => setSelectedStateDetail(state)}
          />
        )}

        {/* Tab 4: Curva de Probabilidade de Vitória */}
        {activeTab === 'probabilidade' && (
          <CurvaProbabilidadeView
            t1Data={turno1BR}
            t2Data={turno2BR}
            states={comparativoData?.estados || []}
            isLoading={isLoading}
          />
        )}

        {/* Tab 5: Análise de Abstenções */}
        {activeTab === 'abstencao' && (
          <AbstencaoView
            data={comparativoData}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* State Detailed Audit Modal */}
      <StateDetailModal
        state={selectedStateDetail}
        onClose={() => setSelectedStateDetail(null)}
      />

      {/* Institutional Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060a10] py-8 px-4 lg:px-8 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Dados oficiais e públicos extraídos diretamente dos sistemas de divulgação e totalização do Tribunal Superior Eleitoral (TSE).
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="https://evolucao-totalizacao.tse.jus.br/painel/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors inline-flex items-center gap-1"
            >
              <span>Painel de Evolução da Totalização (TSE)</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href="https://resultados.tse.jus.br/oficial/app/index.html#/eleicao/6258/uf/br/cargo/1/vis/nominal/resultados"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors inline-flex items-center gap-1"
            >
              <span>Resultados Oficiais 2º Turno (Pleito 6258)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
