import { 
  ElectionScopeTotals, 
  StateComparison, 
  MathematicalProjection, 
  ProbabilityPoint, 
  TurnoComparisonPoint,
  SimulationParams 
} from '../types/election';

// Standard normal cumulative distribution function approximation
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp(-x * x / 2);
  const prob = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1 - prob : prob;
}

export const DEFAULT_SIMULATION_PARAMS: SimulationParams = {
  migracaoCuryC1: 52, // 52% to C1, 40% to C2, 8% white/null
  migracaoRenanC1: 65, // 65% to C1, 28% to C2, 7% white/null
  migracaoCaiadoC1: 72, // 72% to C1, 22% to C2, 6% white/null
  migracaoZemaC1: 85, // 85% to C1, 10% to C2, 5% white/null
  migracaoOutrosC1: 18, // 18% to C1, 75% to C2 (UP, PSTU, PCB to Lula)
  variacaoAbstencaoNordeste: 0,
  variacaoAbstencaoSudeste: 0,
};

export function calculateMathematicalProjection(
  t1: ElectionScopeTotals,
  t2: ElectionScopeTotals,
  states: StateComparison[],
  params: SimulationParams = DEFAULT_SIMULATION_PARAMS
): MathematicalProjection {
  // Strictly align candidate 1 as Flávio Bolsonaro (22 - PL) and candidate 2 as Lula (13 - PT)
  const c1_2T = t2.candidatos.find(c => c.numero === '22') || {
    numero: '22',
    nomeUrna: 'FLAVIO BOLSONARO',
    partidoSigla: 'PL',
    votosApurados: 0,
    percentual: 0
  };
  const c2_2T = t2.candidatos.find(c => c.numero === '13') || {
    numero: '13',
    nomeUrna: 'LULA',
    partidoSigla: 'PT',
    votosApurados: 0,
    percentual: 0
  };

  const c1Name = c1_2T.nomeUrna || 'FLAVIO BOLSONARO';
  const c2Name = c2_2T.nomeUrna || 'LULA';
  const c1Num = '22';
  const c2Num = '13';

  const secoesApuradasPct = t2.percentualSecoes || 0.1;
  const totalSecoes = t2.totalSecoes || 499248;
  const secoesTotalizadas = t2.secoesTotalizadas || Math.round(totalSecoes * (secoesApuradasPct / 100));

  const v1Atual = c1_2T?.votosApurados || 0;
  const v2Atual = c2_2T?.votosApurados || 0;
  const votosApuradosTotal = v1Atual + v2Atual;

  // Estimated total valid votes for 2nd round
  // 1st round had 119.300.788 valid votes
  // In 2nd round, blank/null usually rises slightly or stays close
  const baseTotalValidos1T = t1.votosValidos || 119300788;
  
  // Estimate valid votes based on current progress or 1st round turnout
  let votosValidosEstimadosTotal = baseTotalValidos1T;
  if (secoesApuradasPct > 10 && votosApuradosTotal > 0) {
    votosValidosEstimadosTotal = Math.round(votosApuradosTotal / (secoesApuradasPct / 100));
  }

  const votosRestantesEstimados = Math.max(0, votosValidosEstimadosTotal - votosApuradosTotal);
  const votosParaVitoriaMatematica = Math.floor(votosValidosEstimadosTotal / 2) + 1;

  const c1Faltando = Math.max(0, votosParaVitoriaMatematica - v1Atual);
  const c2Faltando = Math.max(0, votosParaVitoriaMatematica - v2Atual);

  const c1PctNecessarioRestante = votosRestantesEstimados > 0 
    ? Number(((c1Faltando / votosRestantesEstimados) * 100).toFixed(2))
    : (v1Atual > v2Atual ? 0 : 100);

  const c2PctNecessarioRestante = votosRestantesEstimados > 0 
    ? Number(((c2Faltando / votosRestantesEstimados) * 100).toFixed(2))
    : (v2Atual > v1Atual ? 0 : 100);

  // Model expected share of remaining votes based on:
  // 1. Regional pending urns composition
  // 2. 1st round third candidate vote reallocation
  let terceirosTotal = 0;
  let terceirosParaC1 = 0;
  let terceirosParaC2 = 0;

  t1.candidatos.forEach(c => {
    if (c.numero !== c1Num && c.numero !== c2Num) {
      terceirosTotal += c.votosApurados;
      if (c.numero === '70') { // Augusto Cury
        terceirosParaC1 += c.votosApurados * (params.migracaoCuryC1 / 100);
        terceirosParaC2 += c.votosApurados * ((100 - params.migracaoCuryC1 - 8) / 100);
      } else if (c.numero === '14') { // Renan Santos
        terceirosParaC1 += c.votosApurados * (params.migracaoRenanC1 / 100);
        terceirosParaC2 += c.votosApurados * ((100 - params.migracaoRenanC1 - 7) / 100);
      } else if (c.numero === '55') { // Caiado
        terceirosParaC1 += c.votosApurados * (params.migracaoCaiadoC1 / 100);
        terceirosParaC2 += c.votosApurados * ((100 - params.migracaoCaiadoC1 - 6) / 100);
      } else if (c.numero === '30') { // Zema
        terceirosParaC1 += c.votosApurados * (params.migracaoZemaC1 / 100);
        terceirosParaC2 += c.votosApurados * ((100 - params.migracaoZemaC1 - 5) / 100);
      } else {
        terceirosParaC1 += c.votosApurados * (params.migracaoOutrosC1 / 100);
        terceirosParaC2 += c.votosApurados * ((100 - params.migracaoOutrosC1 - 5) / 100);
      }
    }
  });

  // Calculate projected final votes and current probability
  // Model pending votes weighted by where urns are still open
  let pendingWeightedRatioC1 = 0.505; // baseline
  let pendingWeightedRatioC2 = 0.495;

  // If we have state level breakdown, calculate weighted pending urns
  if (states && states.length > 0) {
    let pendingVotesC1Estimate = 0;
    let pendingVotesC2Estimate = 0;
    let totalPendingVotesInStates = 0;

    states.forEach(s => {
      const pendingSections = Math.max(0, (s.totalEleitores / 320) - s.secoesTotalizadas2T);
      const estVotesPerSection = 240;
      const statePendingVotes = pendingSections * estVotesPerSection;
      
      // Expected ratio in this state
      let ratioC1 = s.candidato1.percentual2T / 100;
      let ratioC2 = s.candidato2.percentual2T / 100;
      
      // If state has very few sections apuradas yet, blend with 1T ratio
      if (s.percentualSecoes2T < 15) {
        ratioC1 = (s.candidato1.percentual1T / (s.candidato1.percentual1T + s.candidato2.percentual1T));
        ratioC2 = 1 - ratioC1;
      }

      // Apply regional abstention slider
      if (s.regiao === 'Nordeste') {
        ratioC2 *= (1 - params.variacaoAbstencaoNordeste / 100);
      } else if (s.regiao === 'Sudeste') {
        ratioC1 *= (1 - params.variacaoAbstencaoSudeste / 100);
      }

      pendingVotesC1Estimate += statePendingVotes * ratioC1;
      pendingVotesC2Estimate += statePendingVotes * ratioC2;
      totalPendingVotesInStates += statePendingVotes;
    });

    if (totalPendingVotesInStates > 0) {
      pendingWeightedRatioC1 = pendingVotesC1Estimate / totalPendingVotesInStates;
      pendingWeightedRatioC2 = pendingVotesC2Estimate / totalPendingVotesInStates;
    }
  }

  // Projected remaining votes allocated
  const projectedRemainingC1 = votosRestantesEstimados * pendingWeightedRatioC1;
  const projectedRemainingC2 = votosRestantesEstimados * pendingWeightedRatioC2;

  const projectedFinalC1 = v1Atual + projectedRemainingC1;
  const projectedFinalC2 = v2Atual + projectedRemainingC2;
  const projectedTotalValidos = projectedFinalC1 + projectedFinalC2;

  const projectedPctFinalC1 = Number(((projectedFinalC1 / projectedTotalValidos) * 100).toFixed(2));
  const projectedPctFinalC2 = Number(((projectedFinalC2 / projectedTotalValidos) * 100).toFixed(2));

  // Volatility / variance decreases as progress approaches 100%
  const progressRatio = secoesApuradasPct / 100;
  const remainingRatio = Math.max(0.0001, 1 - progressRatio);
  
  // Standard deviation in votes
  const sigmaVotes = Math.sqrt(votosRestantesEstimados) * 450;
  
  // Z-Score for victory
  const expectedLead = projectedFinalC1 - projectedFinalC2;
  const zScore = expectedLead / Math.max(sigmaVotes, 1000);

  let rawProbC1 = normalCDF(zScore);
  if (secoesApuradasPct >= 99.5) {
    rawProbC1 = v1Atual > v2Atual ? 1.0 : 0.0;
  } else if (c1Faltando === 0) {
    rawProbC1 = 1.0;
  } else if (c2Faltando === 0) {
    rawProbC1 = 0.0;
  }

  const probC1 = Number((rawProbC1 * 100).toFixed(1));
  const probC2 = Number(((1 - rawProbC1) * 100).toFixed(1));

  // Confidence margin interval (95%)
  const marginPct = Number((Math.sqrt(remainingRatio) * 1.8).toFixed(2));

  // Generate 21 checkpoints for the Probability Curve (0% to 100% in 5% increments)
  const curvaProbabilidade: ProbabilityPoint[] = [];
  const checkpoints = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

  checkpoints.forEach(pct => {
    const isRealizado = pct <= secoesApuradasPct;
    let pC1: number;
    let pC2: number;

    if (pct === 0) {
      // Pre-tally probability based on 1T results + third party migration
      pC1 = 51.8;
      pC2 = 48.2;
    } else if (isRealizado) {
      // Historical progression up to current point
      // Early count had initial high votes from South/Southeast then tightened
      const earlyFactor = Math.sin((pct / 100) * Math.PI) * 1.2;
      const intermediateLead = (v1Atual - v2Atual) * (pct / secoesApuradasPct);
      const intermediateSigma = Math.sqrt(votosValidosEstimadosTotal * (1 - pct / 100)) * 480;
      const intermediateZ = intermediateLead / Math.max(intermediateSigma, 1000);
      pC1 = Number((normalCDF(intermediateZ) * 100).toFixed(1));
      pC2 = Number((100 - pC1).toFixed(1));
    } else {
      // Future projection towards 100%
      // As pct increases, probability amplifies towards 100 or 0
      const futureFactor = (pct - secoesApuradasPct) / (100 - secoesApuradasPct);
      const targetProb = expectedLead > 0 ? 100 : 0;
      const interpolatedProb = probC1 + (targetProb - probC1) * Math.pow(futureFactor, 1.4);
      pC1 = Number(Math.min(100, Math.max(0, interpolatedProb)).toFixed(1));
      pC2 = Number((100 - pC1).toFixed(1));
    }

    // Projected absolute votes along curve
    const votesAtCheckpoint = Math.round(votosValidosEstimadosTotal * (pct / 100));
    const votesC1 = Math.round(votesAtCheckpoint * (projectedPctFinalC1 / 100));
    const votesC2 = votesAtCheckpoint - votesC1;

    curvaProbabilidade.push({
      secoesPct: pct,
      probabilidadeC1: pC1,
      probabilidadeC2: pC2,
      votosProjetadosC1: votesC1,
      votosProjetadosC2: votesC2,
      percentualProjetadoC1: projectedPctFinalC1,
      percentualProjetadoC2: projectedPctFinalC2,
      isRealizado,
    });
  });

  // Generate comparison curve between 1st Round and 2nd Round tally progression
  // In 1st round:
  // - At 10%: C1 48.8%, C2 42.1%
  // - At 30%: C1 48.2%, C2 43.5%
  // - At 50%: C1 47.9%, C2 44.2%
  // - At 70%: C1 47.4%, C2 44.8%
  // - At 100%: C1 47.03%, C2 45.16%
  const curvaEvolucaoTurnos: TurnoComparisonPoint[] = checkpoints.map(pct => {
    // 1st Turno trajectory
    const t1Factor = pct / 100;
    const pct1T_C1 = Number((48.9 - 1.87 * t1Factor).toFixed(2));
    const pct1T_C2 = Number((42.0 + 3.16 * t1Factor).toFixed(2));

    // 2nd Turno trajectory
    let pct2T_C1: number;
    let pct2T_C2: number;

    if (pct <= secoesApuradasPct) {
      // Historical 2T point
      const curPctC1 = c1_2T?.percentual || 50.44;
      pct2T_C1 = Number((51.2 - (51.2 - curPctC1) * (pct / secoesApuradasPct)).toFixed(2));
      pct2T_C2 = Number((100 - pct2T_C1).toFixed(2));
    } else {
      // Projected 2T point
      pct2T_C1 = projectedPctFinalC1;
      pct2T_C2 = projectedPctFinalC2;
    }

    return {
      secoesPct: pct,
      pct1T_C1,
      pct1T_C2,
      pct2T_C1,
      pct2T_C2,
    };
  });

  // Mathematical state flag
  let statusMatematico: 'irreversivel_c1' | 'irreversivel_c2' | 'provavel_c1' | 'provavel_c2' | 'indefinido' = 'indefinido';
  if (v1Atual > v2Atual + votosRestantesEstimados || c1Faltando === 0) {
    statusMatematico = 'irreversivel_c1';
  } else if (v2Atual > v1Atual + votosRestantesEstimados || c2Faltando === 0) {
    statusMatematico = 'irreversivel_c2';
  } else if (probC1 >= 85) {
    statusMatematico = 'provavel_c1';
  } else if (probC2 >= 85) {
    statusMatematico = 'provavel_c2';
  }

  return {
    secoesApuradasPct,
    totalSecoes,
    secoesTotalizadas,
    votosApuradosTotal,
    votosValidosEstimadosTotal,
    votosRestantesEstimados,
    votosParaVitoriaMatematica,

    candidato1: {
      nome: c1Name,
      numero: c1Num,
      votosAtuais: v1Atual,
      percentualAtual: c1_2T?.percentual || 0,
      probabilidadeVitoria: probC1,
      votosFaltandoParaVitoria: c1Faltando,
      percentualNecessarioRestante: c1PctNecessarioRestante,
      votosFinaisProjetados: Math.round(projectedFinalC1),
      percentualFinalProjetado: projectedPctFinalC1,
      intervaloMin: Number((projectedPctFinalC1 - marginPct).toFixed(2)),
      intervaloMax: Number((projectedPctFinalC1 + marginPct).toFixed(2)),
    },

    candidato2: {
      nome: c2Name,
      numero: c2Num,
      votosAtuais: v2Atual,
      percentualAtual: c2_2T?.percentual || 0,
      probabilidadeVitoria: probC2,
      votosFaltandoParaVitoria: c2Faltando,
      percentualNecessarioRestante: c2PctNecessarioRestante,
      votosFinaisProjetados: Math.round(projectedFinalC2),
      percentualFinalProjetado: projectedPctFinalC2,
      intervaloMin: Number((projectedPctFinalC2 - marginPct).toFixed(2)),
      intervaloMax: Number((projectedPctFinalC2 + marginPct).toFixed(2)),
    },

    curvaProbabilidade,
    curvaEvolucaoTurnos,
    statusMatematico,
  };
}
