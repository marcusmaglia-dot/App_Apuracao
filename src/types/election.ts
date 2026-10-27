export interface CandidateResult {
  numero: string;
  nomeUrna: string;
  nomeCompleto: string;
  partidoSigla: string;
  partidoNome: string;
  federacao?: string;
  vice?: string;
  votosApurados: number;
  percentual: number; // formatted as number e.g. 47.03
  percentualFormatado: string; // e.g. "47,03%"
  situacao: string; // "2º turno", "Não eleito", "Eleito", etc.
  sequencial: number;
  corPrimaria?: string;
}

export interface ElectionScopeTotals {
  eleicaoId: string;
  turno: 1 | 2;
  abrangencia: string; // "br" or uf code
  ufNome?: string;
  dataHoraGeracao: string;
  dataHoraTotalizacao: string;
  andamento: string; // "f" (finalizada), "p" (parcial)
  
  // Eleitorado e Participação
  totalEleitores: number;
  comparecimento: number;
  percentualComparecimento: number;
  percentualComparecimentoFormatado: string;
  abstencao: number;
  percentualAbstencao: number;
  percentualAbstencaoFormatado: string;

  // Votos
  totalVotos: number;
  votosValidos: number;
  percentualValidos: number;
  percentualValidosFormatado: string;
  votosBrancos: number;
  percentualBrancos: number;
  percentualBrancosFormatado: string;
  votosNulos: number;
  percentualNulos: number;
  percentualNulosFormatado: string;

  // Seções
  totalSecoes: number;
  secoesTotalizadas: number;
  percentualSecoes: number;
  percentualSecoesFormatado: string;

  candidatos: CandidateResult[];
}

export interface StateComparison {
  uf: string;
  nomeEstado: string;
  regiao: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul' | 'Exterior';
  capital?: string;
  totalEleitores: number;
  secoesTotalizadas1T: number;
  percentualSecoes1T: number;
  secoesTotalizadas2T: number;
  percentualSecoes2T: number;
  andamento2T: string;

  // Abstenção
  abstencao1T: number;
  percentualAbstencao1T: number;
  abstencao2T: number;
  percentualAbstencao2T: number;
  variacaoAbstencaoAbs: number;
  variacaoAbstencaoPctPoints: number;

  // Comparecimento
  comparecimento1T: number;
  comparecimento2T: number;

  // Votos Válidos, Brancos e Nulos
  votosValidos1T: number;
  votosValidos2T: number;
  votosBrancos1T: number;
  votosBrancos2T: number;
  votosNulos1T: number;
  votosNulos2T: number;

  // Comparativo dos dois finalistas do 2º Turno
  candidato1: {
    numero: string;
    nome: string;
    partido: string;
    votos1T: number;
    percentual1T: number;
    votos2T: number;
    percentual2T: number;
    variacaoVotosAbs: number;
    variacaoPctPoints: number;
  };
  candidato2: {
    numero: string;
    nome: string;
    partido: string;
    votos1T: number;
    percentual1T: number;
    votos2T: number;
    percentual2T: number;
    variacaoVotosAbs: number;
    variacaoPctPoints: number;
  };

  lider1T: string;
  lider2T: string;
  houveVirada: boolean;
  diferencaVotos2T: number;
  diferencaPct2T: number;
}

export interface ComparativeResponse {
  geracao: string;
  statusConexao: 'online' | 'cached' | 'error';
  totaisBrasil: {
    turno1: ElectionScopeTotals;
    turno2: ElectionScopeTotals;
    variacaoAbstencaoAbs: number;
    variacaoAbstencaoPctPoints: number;
    candidato1DeltaVotos: number;
    candidato1DeltaPctPoints: number;
    candidato2DeltaVotos: number;
    candidato2DeltaPctPoints: number;
  };
  estados: StateComparison[];
}

export interface ProbabilityPoint {
  secoesPct: number;
  probabilidadeC1: number; // 0 to 100
  probabilidadeC2: number; // 0 to 100
  votosProjetadosC1: number;
  votosProjetadosC2: number;
  percentualProjetadoC1: number;
  percentualProjetadoC2: number;
  isRealizado: boolean; // true if already counted, false if projected
}

export interface TurnoComparisonPoint {
  secoesPct: number;
  pct1T_C1: number;
  pct1T_C2: number;
  pct2T_C1: number;
  pct2T_C2: number;
}

export interface MathematicalProjection {
  secoesApuradasPct: number;
  totalSecoes: number;
  secoesTotalizadas: number;
  votosApuradosTotal: number;
  votosValidosEstimadosTotal: number;
  votosRestantesEstimados: number;
  votosParaVitoriaMatematica: number;
  
  candidato1: {
    nome: string;
    numero: string;
    votosAtuais: number;
    percentualAtual: number;
    probabilidadeVitoria: number; // 0 to 100
    votosFaltandoParaVitoria: number;
    percentualNecessarioRestante: number;
    votosFinaisProjetados: number;
    percentualFinalProjetado: number;
    intervaloMin: number;
    intervaloMax: number;
  };
  candidato2: {
    nome: string;
    numero: string;
    votosAtuais: number;
    percentualAtual: number;
    probabilidadeVitoria: number; // 0 to 100
    votosFaltandoParaVitoria: number;
    percentualNecessarioRestante: number;
    votosFinaisProjetados: number;
    percentualFinalProjetado: number;
    intervaloMin: number;
    intervaloMax: number;
  };

  curvaProbabilidade: ProbabilityPoint[];
  curvaEvolucaoTurnos: TurnoComparisonPoint[];
  statusMatematico: 'irreversivel_c1' | 'irreversivel_c2' | 'provavel_c1' | 'provavel_c2' | 'indefinido';
}

export interface SimulationParams {
  migracaoCuryC1: number; // % of Augusto Cury votes going to C1 (default 55)
  migracaoRenanC1: number; // % of Renan Santos votes going to C1 (default 65)
  migracaoCaiadoC1: number; // % of Caiado votes going to C1 (default 70)
  migracaoZemaC1: number; // % of Zema votes going to C1 (default 85)
  migracaoOutrosC1: number; // % of others to C1 (default 20)
  variacaoAbstencaoNordeste: number; // delta in % points
  variacaoAbstencaoSudeste: number; // delta in % points
}

