export interface StateInfo {
  uf: string;
  nome: string;
  regiao: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul' | 'Exterior';
  capital: string;
}

export const BRAZIL_STATES: Record<string, StateInfo> = {
  ac: { uf: 'AC', nome: 'Acre', regiao: 'Norte', capital: 'Rio Branco' },
  al: { uf: 'AL', nome: 'Alagoas', regiao: 'Nordeste', capital: 'Maceió' },
  ap: { uf: 'AP', nome: 'Amapá', regiao: 'Norte', capital: 'Macapá' },
  am: { uf: 'AM', nome: 'Amazonas', regiao: 'Norte', capital: 'Manaus' },
  ba: { uf: 'BA', nome: 'Bahia', regiao: 'Nordeste', capital: 'Salvador' },
  ce: { uf: 'CE', nome: 'Ceará', regiao: 'Nordeste', capital: 'Fortaleza' },
  df: { uf: 'DF', nome: 'Distrito Federal', regiao: 'Centro-Oeste', capital: 'Brasília' },
  es: { uf: 'ES', nome: 'Espírito Santo', regiao: 'Sudeste', capital: 'Vitória' },
  go: { uf: 'GO', nome: 'Goiás', regiao: 'Centro-Oeste', capital: 'Goiânia' },
  ma: { uf: 'MA', nome: 'Maranhão', regiao: 'Nordeste', capital: 'São Luís' },
  mt: { uf: 'MT', nome: 'Mato Grosso', regiao: 'Centro-Oeste', capital: 'Cuiabá' },
  ms: { uf: 'MS', nome: 'Mato Grosso do Sul', regiao: 'Centro-Oeste', capital: 'Campo Grande' },
  mg: { uf: 'MG', nome: 'Minas Gerais', regiao: 'Sudeste', capital: 'Belo Horizonte' },
  pa: { uf: 'PA', nome: 'Pará', regiao: 'Norte', capital: 'Belém' },
  pb: { uf: 'PB', nome: 'Paraíba', regiao: 'Nordeste', capital: 'João Pessoa' },
  pr: { uf: 'PR', nome: 'Paraná', regiao: 'Sul', capital: 'Curitiba' },
  pe: { uf: 'PE', nome: 'Pernambuco', regiao: 'Nordeste', capital: 'Recife' },
  pi: { uf: 'PI', nome: 'Piauí', regiao: 'Nordeste', capital: 'Teresina' },
  rj: { uf: 'RJ', nome: 'Rio de Janeiro', regiao: 'Sudeste', capital: 'Rio de Janeiro' },
  rn: { uf: 'RN', nome: 'Rio Grande do Norte', regiao: 'Nordeste', capital: 'Natal' },
  rs: { uf: 'RS', nome: 'Rio Grande do Sul', regiao: 'Sul', capital: 'Porto Alegre' },
  ro: { uf: 'RO', nome: 'Rondônia', regiao: 'Norte', capital: 'Porto Velho' },
  rr: { uf: 'RR', nome: 'Roraima', regiao: 'Norte', capital: 'Boa Vista' },
  sc: { uf: 'SC', nome: 'Santa Catarina', regiao: 'Sul', capital: 'Florianópolis' },
  sp: { uf: 'SP', nome: 'São Paulo', regiao: 'Sudeste', capital: 'São Paulo' },
  se: { uf: 'SE', nome: 'Sergipe', regiao: 'Nordeste', capital: 'Aracaju' },
  to: { uf: 'TO', nome: 'Tocantins', regiao: 'Norte', capital: 'Palmas' },
  zz: { uf: 'ZZ', nome: 'Exterior', regiao: 'Exterior', capital: 'Votação no Exterior' },
};

export const CANDIDATE_COLORS: Record<string, { primary: string; light: string; border: string }> = {
  '22': { primary: '#2563eb', light: '#1d4ed820', border: '#3b82f6' }, // PL - Azul
  '13': { primary: '#dc2626', light: '#b91c1c20', border: '#ef4444' }, // PT - Vermelho
  '70': { primary: '#0284c7', light: '#0369a120', border: '#38bdf8' }, // Avante
  '14': { primary: '#059669', light: '#04785720', border: '#10b981' }, // Missão
  '55': { primary: '#ea580c', light: '#c2410c20', border: '#f97316' }, // PSD
  '30': { primary: '#f59e0b', light: '#d9770620', border: '#fbbf24' }, // NOVO
  '80': { primary: '#7c3aed', light: '#6d28d920', border: '#8b5cf6' }, // UP
  '16': { primary: '#e11d48', light: '#be123c20', border: '#f43f5e' }, // PSTU
  '27': { primary: '#475569', light: '#33415520', border: '#64748b' }, // DC
  '21': { primary: '#991b1b', light: '#7f1d1d20', border: '#b91c1c' }, // PCB
  '35': { primary: '#0d9488', light: '#0f766e20', border: '#14b8a6' }, // Dem
  '29': { primary: '#b45309', light: '#92400e20', border: '#d97706' }, // PCO
};

export function getCandidateColor(num: string) {
  return CANDIDATE_COLORS[num] || { primary: '#64748b', light: '#47556920', border: '#94a3b8' };
}
