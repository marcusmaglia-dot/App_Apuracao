import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// TSE Config
const TSE_BASE_URL = 'https://resultados.tse.jus.br/oficial';
const ELECTION_ID_1T = '6257';
const ELECTION_ID_2T = '6258';

const UFS = [
  'ac', 'al', 'ap', 'am', 'ba', 'ce', 'df', 'es', 'go', 'ma',
  'mt', 'ms', 'mg', 'pa', 'pb', 'pr', 'pe', 'pi', 'rj', 'rn',
  'rs', 'ro', 'rr', 'sc', 'sp', 'se', 'to', 'zz'
];

const UF_NAMES: Record<string, { nome: string; regiao: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul' | 'Exterior'; capital: string }> = {
  ac: { nome: 'Acre', regiao: 'Norte', capital: 'Rio Branco' },
  al: { nome: 'Alagoas', regiao: 'Nordeste', capital: 'Maceió' },
  ap: { nome: 'Amapá', regiao: 'Norte', capital: 'Macapá' },
  am: { nome: 'Amazonas', regiao: 'Norte', capital: 'Manaus' },
  ba: { nome: 'Bahia', regiao: 'Nordeste', capital: 'Salvador' },
  ce: { nome: 'Ceará', regiao: 'Nordeste', capital: 'Fortaleza' },
  df: { nome: 'Distrito Federal', regiao: 'Centro-Oeste', capital: 'Brasília' },
  es: { nome: 'Espírito Santo', regiao: 'Sudeste', capital: 'Vitória' },
  go: { nome: 'Goiás', regiao: 'Centro-Oeste', capital: 'Goiânia' },
  ma: { nome: 'Maranhão', regiao: 'Nordeste', capital: 'São Luís' },
  mt: { nome: 'Mato Grosso', regiao: 'Centro-Oeste', capital: 'Cuiabá' },
  ms: { nome: 'Mato Grosso do Sul', regiao: 'Centro-Oeste', capital: 'Campo Grande' },
  mg: { nome: 'Minas Gerais', regiao: 'Sudeste', capital: 'Belo Horizonte' },
  pa: { nome: 'Pará', regiao: 'Norte', capital: 'Belém' },
  pb: { nome: 'Paraíba', regiao: 'Nordeste', capital: 'João Pessoa' },
  pr: { nome: 'Paraná', regiao: 'Sul', capital: 'Curitiba' },
  pe: { nome: 'Pernambuco', regiao: 'Nordeste', capital: 'Recife' },
  pi: { nome: 'Piauí', regiao: 'Nordeste', capital: 'Teresina' },
  rj: { nome: 'Rio de Janeiro', regiao: 'Sudeste', capital: 'Rio de Janeiro' },
  rn: { nome: 'Rio Grande do Norte', regiao: 'Nordeste', capital: 'Natal' },
  rs: { nome: 'Rio Grande do Sul', regiao: 'Sul', capital: 'Porto Alegre' },
  ro: { nome: 'Rondônia', regiao: 'Norte', capital: 'Porto Velho' },
  rr: { nome: 'Roraima', regiao: 'Norte', capital: 'Boa Vista' },
  sc: { nome: 'Santa Catarina', regiao: 'Sul', capital: 'Florianópolis' },
  sp: { nome: 'São Paulo', regiao: 'Sudeste', capital: 'São Paulo' },
  se: { nome: 'Sergipe', regiao: 'Nordeste', capital: 'Aracaju' },
  to: { nome: 'Tocantins', regiao: 'Norte', capital: 'Palmas' },
  zz: { nome: 'Exterior', regiao: 'Exterior', capital: 'Votação no Exterior' },
};

function parseNum(val: unknown, fallback = 0): number {
  if (typeof val === 'number') return val;
  if (!val) return fallback;
  const str = String(val).replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? fallback : num;
}

function parsePct(strVal: unknown, fallback = 0): number {
  if (!strVal) return fallback;
  const str = String(strVal).replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? fallback : Number(num.toFixed(2));
}

// In-memory cache structures
interface CacheStore {
  turno1BR: any | null;
  turno1UFs: Record<string, any>;
  turno1Timestamp: number;
  
  turno2BR: any | null;
  turno2UFs: Record<string, any>;
  turno2Timestamp: number;
}

const cache: CacheStore = {
  turno1BR: null,
  turno1UFs: {},
  turno1Timestamp: 0,
  turno2BR: null,
  turno2UFs: {},
  turno2Timestamp: 0,
};

function normalizeTsePayload(raw: any, electionId: string, turno: 1 | 2, scope: string) {
  const e = raw.e || {};
  const v = raw.v || {};
  const s = raw.s || {};
  const carg = (raw.carg && raw.carg[0]) || {};

  const candidatos: any[] = [];
  if (carg.agr && Array.isArray(carg.agr)) {
    for (const agr of carg.agr) {
      if (agr.par && Array.isArray(agr.par)) {
        for (const par of agr.par) {
          if (par.cand && Array.isArray(par.cand)) {
            for (const cand of par.cand) {
              const vice = cand.vs && cand.vs[0] ? cand.vs[0].nm : undefined;
              candidatos.push({
                numero: cand.n,
                nomeUrna: cand.nmu || cand.nm,
                nomeCompleto: cand.nm,
                partidoSigla: par.sg,
                partidoNome: par.nm,
                federacao: agr.nm !== par.nm ? agr.nm : undefined,
                vice,
                votosApurados: parseNum(cand.vap),
                percentual: parsePct(cand.pvap),
                percentualFormatado: `${cand.pvap || '0,00'}%`,
                situacao: cand.st || (cand.e === 's' ? 'Eleito' : ''),
                sequencial: parseInt(cand.seq || '999', 10),
              });
            }
          }
        }
      }
    }
  }

  // Sort candidates by votes descending
  candidatos.sort((a, b) => b.votosApurados - a.votosApurados);

  const totalEleitores = parseNum(e.te);
  const comparecimento = parseNum(e.c);
  const percentualComparecimento = parsePct(e.pc);
  const abstencao = parseNum(e.a);
  const percentualAbstencao = parsePct(e.pa);

  const totalVotos = parseNum(v.tv);
  const votosValidos = parseNum(v.vv || v.vvc);
  const percentualValidos = parsePct(v.pvvc || v.pvv);
  const votosBrancos = parseNum(v.vb);
  const percentualBrancos = parsePct(v.pvb);
  const votosNulos = parseNum(v.tvn || v.vn);
  const percentualNulos = parsePct(v.ptvn || v.pvn);

  const totalSecoes = parseNum(s.ts);
  const secoesTotalizadas = parseNum(s.st);
  const percentualSecoes = parsePct(s.pst);

  return {
    eleicaoId: electionId,
    turno,
    abrangencia: scope.toLowerCase(),
    ufNome: scope === 'br' ? 'Brasil' : UF_NAMES[scope.toLowerCase()]?.nome || scope.toUpperCase(),
    dataHoraGeracao: `${raw.dg || ''} ${raw.hg || ''}`.trim(),
    dataHoraTotalizacao: `${raw.dt || ''} ${raw.ht || ''}`.trim(),
    andamento: raw.and || 'p',
    totalEleitores,
    comparecimento,
    percentualComparecimento,
    percentualComparecimentoFormatado: `${e.pc || '0,00'}%`,
    abstencao,
    percentualAbstencao,
    percentualAbstencaoFormatado: `${e.pa || '0,00'}%`,
    totalVotos,
    votosValidos,
    percentualValidos,
    percentualValidosFormatado: `${v.pvvc || v.pvv || '0,00'}%`,
    votosBrancos,
    percentualBrancos,
    percentualBrancosFormatado: `${v.pvb || '0,00'}%`,
    votosNulos,
    percentualNulos,
    percentualNulosFormatado: `${v.ptvn || v.pvn || '0,00'}%`,
    totalSecoes,
    secoesTotalizadas,
    percentualSecoes,
    percentualSecoesFormatado: `${s.pst || '0,00'}%`,
    candidatos,
  };
}

async function fetchFromTse(url: string): Promise<any> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`TSE request failed: ${response.status} for ${url}`);
  }
  return await response.json();
}

async function getTurno1Data() {
  const now = Date.now();
  // Cache 1º turno for 5 minutes since it is completed
  if (cache.turno1BR && now - cache.turno1Timestamp < 300000 && Object.keys(cache.turno1UFs).length >= 27) {
    return { br: cache.turno1BR, ufs: cache.turno1UFs };
  }

  try {
    const rawBR = await fetchFromTse(`${TSE_BASE_URL}/ele2026/${ELECTION_ID_1T}/dados/br/br-c0001-e00${ELECTION_ID_1T}-u.json`);
    const parsedBR = normalizeTsePayload(rawBR, ELECTION_ID_1T, 1, 'br');
    cache.turno1BR = parsedBR;

    // Fetch UFs in chunks to be gentle with rate limits
    const ufPromises = UFS.map(async (uf) => {
      try {
        const rawUF = await fetchFromTse(`${TSE_BASE_URL}/ele2026/${ELECTION_ID_1T}/dados/${uf}/${uf}-c0001-e00${ELECTION_ID_1T}-u.json`);
        return { uf, data: normalizeTsePayload(rawUF, ELECTION_ID_1T, 1, uf) };
      } catch (e) {
        console.warn(`Could not fetch 1T for ${uf}`, e);
        return { uf, data: null };
      }
    });

    const ufResults = await Promise.all(ufPromises);
    for (const res of ufResults) {
      if (res.data) {
        cache.turno1UFs[res.uf] = res.data;
      }
    }
    cache.turno1Timestamp = now;
  } catch (err) {
    console.error('Error fetching 1T data from TSE:', err);
    if (!cache.turno1BR) {
      throw err;
    }
  }

  return { br: cache.turno1BR, ufs: cache.turno1UFs };
}

async function getTurno2Data() {
  const now = Date.now();
  // Cache 2º turno for 12 seconds during live tally
  if (cache.turno2BR && now - cache.turno2Timestamp < 12000 && Object.keys(cache.turno2UFs).length >= 27) {
    return { br: cache.turno2BR, ufs: cache.turno2UFs };
  }

  try {
    const rawBR = await fetchFromTse(`${TSE_BASE_URL}/ele2026/${ELECTION_ID_2T}/dados/br/br-c0001-e00${ELECTION_ID_2T}-u.json`);
    const parsedBR = normalizeTsePayload(rawBR, ELECTION_ID_2T, 2, 'br');
    cache.turno2BR = parsedBR;

    const ufPromises = UFS.map(async (uf) => {
      try {
        const rawUF = await fetchFromTse(`${TSE_BASE_URL}/ele2026/${ELECTION_ID_2T}/dados/${uf}/${uf}-c0001-e00${ELECTION_ID_2T}-u.json`);
        return { uf, data: normalizeTsePayload(rawUF, ELECTION_ID_2T, 2, uf) };
      } catch (e) {
        console.warn(`Could not fetch 2T for ${uf}`, e);
        return { uf, data: null };
      }
    });

    const ufResults = await Promise.all(ufPromises);
    for (const res of ufResults) {
      if (res.data) {
        cache.turno2UFs[res.uf] = res.data;
      }
    }
    cache.turno2Timestamp = now;
  } catch (err) {
    console.error('Error fetching 2T data from TSE:', err);
    if (!cache.turno2BR) {
      throw err;
    }
  }

  return { br: cache.turno2BR, ufs: cache.turno2UFs };
}

// Routes
app.get('/api/eleicao/status', async (_req, res) => {
  res.json({
    status: 'online',
    tseBaseUrl: TSE_BASE_URL,
    eleicao1T: ELECTION_ID_1T,
    eleicao2T: ELECTION_ID_2T,
    cache1T: cache.turno1Timestamp ? new Date(cache.turno1Timestamp).toISOString() : null,
    cache2T: cache.turno2Timestamp ? new Date(cache.turno2Timestamp).toISOString() : null,
  });
});

app.get('/api/eleicao/primeiro-turno', async (_req, res) => {
  try {
    const data = await getTurno1Data();
    res.json({
      brasil: data.br,
      estados: data.ufs,
      origem: 'https://evolucao-totalizacao.tse.jus.br/painel/index.html',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar dados do 1º Turno', message: err.message });
  }
});

app.get('/api/eleicao/segundo-turno', async (_req, res) => {
  try {
    const data = await getTurno2Data();
    res.json({
      brasil: data.br,
      estados: data.ufs,
      origem: 'https://resultados.tse.jus.br/oficial/app/index.html#/eleicao/6258/uf/br/cargo/1/vis/nominal/resultados',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar dados do 2º Turno', message: err.message });
  }
});

app.get('/api/eleicao/comparativo', async (_req, res) => {
  try {
    const [t1, t2] = await Promise.all([getTurno1Data(), getTurno2Data()]);

    const br1 = t1.br;
    const br2 = t2.br;

    // Strictly align candidates by their official ballot numbers:
    // 22 = FLAVIO BOLSONARO (PL)
    // 13 = LULA (PT)
    const cand22_2T = br2.candidatos.find((c: any) => c.numero === '22') || {
      numero: '22',
      nomeUrna: 'FLAVIO BOLSONARO',
      partidoSigla: 'PL',
      partidoNome: 'PARTIDO LIBERAL',
      votosApurados: 0,
      percentual: 0
    };
    const cand13_2T = br2.candidatos.find((c: any) => c.numero === '13') || {
      numero: '13',
      nomeUrna: 'LULA',
      partidoSigla: 'PT',
      partidoNome: 'PARTIDO DOS TRABALHADORES',
      votosApurados: 0,
      percentual: 0
    };

    const cand22_1T = br1.candidatos.find((c: any) => c.numero === '22');
    const cand13_1T = br1.candidatos.find((c: any) => c.numero === '13');

    const estadosComparados = UFS.map((uf) => {
      const uf1 = t1.ufs[uf];
      const uf2 = t2.ufs[uf];
      const meta = UF_NAMES[uf];

      if (!uf1 && !uf2) return null;

      // Find Cand 22 (Flavio Bolsonaro - PL) in 1T and 2T for this state
      const c22_1 = uf1?.candidatos?.find((c: any) => c.numero === '22');
      const c22_2 = uf2?.candidatos?.find((c: any) => c.numero === '22');

      // Find Cand 13 (Lula - PT) in 1T and 2T for this state
      const c13_1 = uf1?.candidatos?.find((c: any) => c.numero === '13');
      const c13_2 = uf2?.candidatos?.find((c: any) => c.numero === '13');

      const v22_1 = c22_1 ? c22_1.votosApurados : 0;
      const v22_2 = c22_2 ? c22_2.votosApurados : 0;
      const p22_1 = c22_1 ? c22_1.percentual : 0;
      const p22_2 = c22_2 ? c22_2.percentual : 0;

      const v13_1 = c13_1 ? c13_1.votosApurados : 0;
      const v13_2 = c13_2 ? c13_2.votosApurados : 0;
      const p13_1 = c13_1 ? c13_1.percentual : 0;
      const p13_2 = c13_2 ? c13_2.percentual : 0;

      const abst1 = uf1 ? uf1.abstencao : 0;
      const abst2 = uf2 ? uf2.abstencao : 0;
      const pabst1 = uf1 ? uf1.percentualAbstencao : 0;
      const pabst2 = uf2 ? uf2.percentualAbstencao : 0;

      const lider1T = v22_1 >= v13_1 ? 'FLAVIO BOLSONARO' : 'LULA';
      const lider2T = v22_2 >= v13_2 ? 'FLAVIO BOLSONARO' : 'LULA';
      const houveVirada = lider1T !== lider2T && (v22_2 > 0 || v13_2 > 0);

      return {
        uf: uf.toUpperCase(),
        nomeEstado: meta?.nome || uf.toUpperCase(),
        regiao: meta?.regiao || 'Exterior',
        capital: meta?.capital || '',
        totalEleitores: uf2?.totalEleitores || uf1?.totalEleitores || 0,
        secoesTotalizadas1T: uf1?.secoesTotalizadas || 0,
        percentualSecoes1T: uf1?.percentualSecoes || 100,
        secoesTotalizadas2T: uf2?.secoesTotalizadas || 0,
        percentualSecoes2T: uf2?.percentualSecoes || 0,
        andamento2T: uf2?.andamento || 'p',

        abstencao1T: abst1,
        percentualAbstencao1T: pabst1,
        abstencao2T: abst2,
        percentualAbstencao2T: pabst2,
        variacaoAbstencaoAbs: abst2 - abst1,
        variacaoAbstencaoPctPoints: Number((pabst2 - pabst1).toFixed(2)),

        comparecimento1T: uf1?.comparecimento || 0,
        comparecimento2T: uf2?.comparecimento || 0,

        votosValidos1T: uf1?.votosValidos || 0,
        votosValidos2T: uf2?.votosValidos || 0,
        votosBrancos1T: uf1?.votosBrancos || 0,
        votosBrancos2T: uf2?.votosBrancos || 0,
        votosNulos1T: uf1?.votosNulos || 0,
        votosNulos2T: uf2?.votosNulos || 0,

        candidato1: {
          numero: '22',
          nome: cand22_2T.nomeUrna || 'FLAVIO BOLSONARO',
          partido: 'PL',
          votos1T: v22_1,
          percentual1T: p22_1,
          votos2T: v22_2,
          percentual2T: p22_2,
          variacaoVotosAbs: v22_2 - v22_1,
          variacaoPctPoints: Number((p22_2 - p22_1).toFixed(2)),
        },
        candidato2: {
          numero: '13',
          nome: cand13_2T.nomeUrna || 'LULA',
          partido: 'PT',
          votos1T: v13_1,
          percentual1T: p13_1,
          votos2T: v13_2,
          percentual2T: p13_2,
          variacaoVotosAbs: v13_2 - v13_1,
          variacaoPctPoints: Number((p13_2 - p13_1).toFixed(2)),
        },

        lider1T,
        lider2T,
        houveVirada,
        diferencaVotos2T: Math.abs(v22_2 - v13_2),
        diferencaPct2T: Number(Math.abs(p22_2 - p13_2).toFixed(2)),
      };
    }).filter(Boolean);

    res.json({
      geracao: new Date().toISOString(),
      statusConexao: 'online',
      totaisBrasil: {
        turno1: br1,
        turno2: br2,
        variacaoAbstencaoAbs: br2.abstencao - br1.abstencao,
        variacaoAbstencaoPctPoints: Number((br2.percentualAbstencao - br1.percentualAbstencao).toFixed(2)),
        candidato1DeltaVotos: (cand22_2T?.votosApurados || 0) - (cand22_1T?.votosApurados || 0),
        candidato1DeltaPctPoints: Number(((cand22_2T?.percentual || 0) - (cand22_1T?.percentual || 0)).toFixed(2)),
        candidato2DeltaVotos: (cand13_2T?.votosApurados || 0) - (cand13_1T?.votosApurados || 0),
        candidato2DeltaPctPoints: Number(((cand13_2T?.percentual || 0) - (cand13_1T?.percentual || 0)).toFixed(2)),
      },
      estados: estadosComparados,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao gerar comparativo', message: err.message });
  }
});

// Start Express server and mount Vite in development
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Eleições 2026 TSE Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
