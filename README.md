# Cronos

Base do projeto integrador para orquestracao de tarefas e automacoes. O repositorio usa um monorepo com npm workspaces, TypeScript e responsabilidades separadas por aplicacao.

## Estrutura

```text
Cronos/
├── apps/
│   ├── web/                 # Frontend React + Vite
│   ├── server/              # Backend HTTP/API Express
│   └── realtime/            # WebSocket e automacoes em tempo real
├── packages/
│   └── shared/              # Tipos e contratos entre aplicacoes
├── cores/                   # Referencia original da paleta
└── .env.example
```

## Responsabilidades

- **web**: paginas, componentes, estilos e chamadas para a API.
- **server**: endpoints HTTP, regras de negocio e integracoes.
- **realtime**: conexoes WebSocket, eventos e gerenciamento de automacoes.
- **shared**: tipos conhecidos pelo frontend e pelos servicos.

## Pre-requisitos

- Node.js 20 ou superior
- npm 10 ou superior

## Instalacao e desenvolvimento

```bash
npm install
npm run dev
```

O comando `npm run dev` inicia os tres servicos:

| Servico | URL/porta | Funcao |
| --- | --- | --- |
| Frontend | http://localhost:3000 | Interface web |
| Backend | http://localhost:3001 | API e `GET /health` |
| Realtime | ws://localhost:3002 | Eventos WebSocket |

Para iniciar um servico isoladamente, use `npm run dev:web`, `npm run dev:server` ou `npm run dev:realtime`.

## Build e producao

```bash
npm run build
npm run start
npm run start:realtime
```

O build compila `shared`, `server`, `realtime` e `web` nessa ordem.

## Como evoluir

1. Crie modulos de dominio em `apps/server/src/modules/`.
2. Crie paginas e componentes em `apps/web/src/`.
3. Mantenha conexoes e eventos em `apps/realtime/src/`.
4. Adicione contratos compartilhados em `packages/shared/src/`.

## Paleta e estilos

`cores/palheta.jpeg` permanece como referencia visual. Os valores estao centralizados como tokens CSS em `apps/web/src/styles/theme.css`:

- `--color-primary`: `#5B21B6`
- `--color-accent`: `#FACC15`
- `--color-ink`: `#1E1B4B`
- `--color-surface`: `#F8FAFC`

Importe o tema em novas telas e use `var(--color-primary)` ou os demais tokens. Assim, a identidade visual e alterada em um unico lugar.

## Dependencias

As dependencias atuais sao as necessarias para a base funcionar. PostgreSQL nao foi incluido porque ainda nao existe persistencia implementada; ele deve ser adicionado junto com o modulo de banco quando essa etapa comecar.
