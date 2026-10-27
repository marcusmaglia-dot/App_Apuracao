# 🗳️ Painel de Apuração e Comparativo Eleitoral — Eleições Presidenciais 2026

[![TSE Oficial](https://img.shields.io/badge/Fonte-TSE%20Oficial-blue.svg)](https://resultados.tse.jus.br/)
[![Firebase Firestore](https://img.shields.io/badge/Database-Firebase%20Firestore-orange.svg)](https://firebase.google.com/)
[![React 19](https://img.shields.io/badge/Frontend-React%2019-cyan.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Style-Tailwind%20v4-38bdf8.svg)](https://tailwindcss.com/)
[![Status](https://img.shields.io/badge/Status-Online%20%26%20P%C3%BAblico-emerald.svg)](https://ais-pre-pvqfqdgqbht7arfkehbbvp-465822566801.us-west2.run.app)

Sistema completo de monitoramento, auditoria e inteligência estatística para as **Eleições Presidenciais de 2026 no Brasil**. A aplicação consome os dados oficiais disponibilizados pelo **Tribunal Superior Eleitoral (TSE)**, permitindo o acompanhamento do 1º Turno, a apuração voto a voto do 2º Turno, a auditoria comparativa estado por estado (27 UFs + Exterior) e um modelo probabilístico de projeção matemática com simulação Monte Carlo.

---

## 🌐 Acesso Público & Demonstração

- **URL Pública da Aplicação:**  
  👉 **[https://ais-pre-pvqfqdgqbht7arfkehbbvp-465822566801.us-west2.run.app](https://ais-pre-pvqfqdgqbht7arfkehbbvp-465822566801.us-west2.run.app)**

- **Fontes Oficiais Conectadas:**
  - Painel de Evolução da Totalização (1º Turno): [evolucao-totalizacao.tse.jus.br](https://evolucao-totalizacao.tse.jus.br/painel/index.html)
  - Divulgação Oficial de Resultados (2º Turno - Pleito 6258): [resultados.tse.jus.br](https://resultados.tse.jus.br/oficial/app/index.html#/eleicao/6258/uf/br/cargo/1/vis/nominal/resultados)

---

## 📌 Principais Funcionalidades

### 1. 📊 Painel do 1º Turno (Totalização Geral Consolidada)
- Votação nominal absoluta e percentual de **todos os 12 candidatos** a presidente.
- Contabilização detalhada de comparecimento, votos válidos, brancos, nulos e **abstenções**.
- Seletor de abrangência geográfica: visão nacional (Brasil) ou detalhada por estado (27 UFs).
- Exportação dos dados consolidados em formato CSV.

### 2. ⚡ Apuração em Tempo Real do 2º Turno (Pleito 6258)
- Disputa presidencial entre os dois candidatos finalistas com vinculação partidária e número estritamente alinhados:
  - **Flávio Bolsonaro** — **PL (Partido Liberal)** — **Número 22** (Identidade: Azul)
  - **Lula** — **PT (Partido dos Trabalhadores)** — **Número 13** (Identidade: Vermelho)
- Atualização em tempo real de urnas apuradas, diferença de votos e margem percentual.
- Termômetro de ritmo da apuração e cálculo dinâmico de votos restantes para a maioria matemática (50% + 1 voto).

### 3. 🗺️ Painel Comparativo por Estado (1º Turno vs. 2º Turno)
- Tabela comparativa e visualização em cartões de todas as 27 Unidades da Federação e Zona Eleitoral do Exterior (ZZ).
- Indicadores de migração de votos: variação absoluta de votos e oscilação em pontos percentuais (p.p.) para cada candidato.
- Análise de variação das abstenções por estado.
- Destaque automático de **viradas eleitorais** (estados onde a liderança mudou de candidato entre os turnos).
- Modal de auditoria detalhada com estatísticas cívicas completas por UF.
- Filtro por regiões brasileiras (Sudeste, Nordeste, Sul, Norte, Centro-Oeste e Exterior) e exportação em CSV.

### 4. 📈 Curva de Probabilidade & Simulador de Sensibilidade Monte Carlo
- Curva contínua de probabilidade de vitória de 0% a 100% de urnas apuradas.
- Gráfico comparativo de trajetória temporal da votação entre o 1º e o 2º Turno.
- **Simulador de Sensibilidade**: ajuste paramétrico da transferência de votos de candidatos do 1º turno:
  - Augusto Cury (Avante)
  - Renan Santos (Missão)
  - Ronaldo Caiado (PSD)
  - Romeu Zema (NOVO)
  - Outros candidatos e oscilação regional de abstenção (Nordeste e Sudeste)
- **Persistência em Nuvem via Firebase Firestore**: salve e carregue cenários hipotéticos personalizados para simulações e debates eleitorais.

---

## 🏛️ Alinhamento Partidário e de Candidatos

O sistema implementa uma camada de proteção que impede qualquer inversão de rótulos partidários decorrente da ordenação dinâmica de votos do TSE:

| Candidato | Número de Urna | Partido | Sigla | Cor Oficial |
| :--- | :---: | :--- | :---: | :---: |
| **Flávio Bolsonaro** | **22** | Partido Liberal | **PL** | 🔵 Azul (`#2563eb`) |
| **Lula** | **13** | Partido dos Trabalhadores | **PT** | 🔴 Vermelho (`#dc2626`) |

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:**
  - [React 19](https://react.dev/) com TypeScript
  - [Tailwind CSS v4](https://tailwindcss.com/)
  - [Lucide Icons](https://lucide.dev/)
  - [Motion](https://motion.dev/)
- **Backend / Proxy de API:**
  - [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
  - [TSX](https://github.com/privatenumber/tsx) para execução TypeScript de alta velocidade
  - Cache inteligente de requisições com *throttle* para respeitar os limites de taxa dos endpoints oficiais do TSE
- **Banco de Dados & Nuvem:**
  - [Firebase Firestore](https://firebase.google.com/docs/firestore) para armazenamento em nuvem de cenários e simulações
  - Regras de segurança auditadas (`firestore.rules`)
- **Infraestrutura:**
  - Google Cloud Run (Container sem servidor com suporte a tráfego escalável)

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js 20.x ou superior
- Gerenciador de pacotes `npm` ou `bun`

### 1. Clonar o Repositório
```bash
git clone https://github.com/SEU_USUARIO/apuracao-eleicoes-2026.git
cd apuracao-eleicoes-2026
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente (Opcional)
Copie o arquivo de exemplo caso deseje customizar portas ou URLs:
```bash
cp .env.example .env
```

### 4. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
O servidor iniciará em `http://localhost:3000`, rodando tanto a API Express quanto o Vite SPA integrados.

### 5. Compilar para Produção
```bash
npm run build
npm start
```

---

## 📁 Estrutura de Diretórios

```
├── .env.example                 # Exemplo de configuração de variáveis
├── .gitignore                   # Arquivos ignorados pelo Git
├── firebase-applet-config.json  # Configurações do projeto Firebase
├── firebase-blueprint.json      # Esquema e definições do Firestore
├── firestore.rules              # Regras de segurança do banco de dados
├── index.html                   # Entry-point HTML com metatags e OpenGraph
├── metadata.json                # Metadados e permissões da aplicação
├── package.json                 # Dependências e scripts
├── server.ts                    # Servidor Express, Proxy de APIs do TSE e cache
├── tsconfig.json                # Configuração TypeScript
├── vite.config.ts               # Configuração do Vite e Tailwind v4
└── src/
    ├── main.tsx                 # Ponto de entrada do React
    ├── App.tsx                  # Componente raiz com navegação por abas
    ├── index.css                # Estilos globais e tipografia
    ├── components/              # Componentes de interface
    │   ├── PrimeiroTurnoView.tsx     # Visão consolidada do 1º Turno
    │   ├── SegundoTurnoView.tsx      # Apuração em tempo real do 2º Turno
    │   ├── ComparativoEstadosView.tsx# Tabela e cartões comparativos das UFs
    │   ├── StateDetailModal.tsx      # Modal de auditoria detalhada por estado
    │   └── CurvaProbabilidadeView.tsx# Modelo matemático e simulação Monte Carlo
    ├── lib/                     # Integrações com Firebase e serviços
    │   ├── firebase.ts          # Inicialização segura do SDK Firebase
    │   └── scenarioService.ts   # CRUD de cenários e simulações
    ├── types/                   # Definições de tipos TypeScript
    │   └── election.ts          # Tipos para dados do TSE e projeções
    └── utils/                   # Funções auxiliares
        ├── formatters.ts        # Formatação numérica brasileira (ABNT)
        ├── probabilityEngine.ts # Motor estatístico e projeção gaussiana
        └── states.ts            # Mapeamento geográfico das 27 UFs + ZZ
```

---

## 🔒 Regras de Segurança e Privacidade

- **Acesso Público**: As estatísticas eleitorais são dados públicos do domínio do Tribunal Superior Eleitoral.
- **Armazenamento Seguro**: As coleções de simulações do Firestore são protegidas por validação de campos e controle de tamanho para impedir abusos.

---

## 📄 Como Publicar este Repositório no GitHub

Para publicar o código como um repositório público no seu GitHub pessoal ou organizacional, execute os seguintes comandos no terminal:

```bash
# 1. Inicializar o repositório Git local (se ainda não estiver inicializado)
git init

# 2. Adicionar todos os arquivos ao controle de versão
git add .

# 3. Fazer o primeiro commit
git commit -m "feat: versão inicial do painel de apuração das eleições 2026 com comparativo estadual e simulador"

# 4. Vincular ao seu repositório remoto público no GitHub
git remote add origin https://github.com/SEU_USUARIO/apuracao-eleicoes-2026.git

# 5. Definir a branch principal e enviar os arquivos
git branch -M main
git push -u origin main
```

---

## ⚖️ Licença e Responsabilidade

Os dados eleitorais são fornecidos publicamente pela Justiça Eleitoral Brasileira (TSE). Este projeto foi desenvolvido para fins de informação cívica, pesquisa eleitoral e análise estatística independente.
