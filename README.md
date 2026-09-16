# Cronos — Orquestrador

Projeto orquestrador construído com arquitetura monorepo utilizando **Node.js**, **React**, **TypeScript** e suporte para **PostgreSQL**.

---

## 📁 Estrutura do Repositório

```text
Cronos/
├── apps/
│   ├── server/           # Backend (Node.js + Express + TypeScript)
│   │   ├── src/
│   │   │   └── index.ts  # Servidor HTTP inicial com healthcheck (/health)
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/              # Frontend (React 19 + Vite + TypeScript)
│       ├── src/
│       │   ├── App.tsx   # Componente raiz minimalista
│       │   └── main.tsx  # Ponto de montagem React
│       ├── index.html
│       ├── vite.config.ts
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared/           # Tipos, interfaces e contratos compartilhados
│       ├── src/
│       │   └── index.ts  # Definições (JobStatus, BaseJob, ApiResponse, etc.)
│       ├── package.json
│       └── tsconfig.json
├── .env.example          # Exemplo de variáveis de ambiente (PORT, DATABASE_URL)
├── .gitignore            # Ignora node_modules, dist, .env, etc.
├── package.json          # Root workspace com scripts unificados
└── tsconfig.base.json    # Configurações base de TypeScript
```

---

## 🚀 Como Executar

### 1. Pré-requisitos

- Node.js (v20+)
- npm (v10+)

### 2. Instalação das dependências

Na raiz do projeto:

```bash
npm install
```

### 3. Rodando em Modo de Desenvolvimento

Para rodar tanto o servidor quanto o frontend simultaneamente:

```bash
npm run dev
```

- **Backend**: http://localhost:3001 (Endpoint de teste: `http://localhost:3001/health`)
- **Frontend**: http://localhost:3000

Você também pode rodar isoladamente:

```bash
npm run dev:server  # Apenas o backend (com hot reload via tsx)
npm run dev:web     # Apenas o frontend (com HMR via Vite)
```

### 4. Build de Produção

Compila todos os pacotes na ordem correta (`shared` ➔ `server` ➔ `web`):

```bash
npm run build
```

### 5. Iniciar Servidor em Produção

```bash
npm run start
```

---

## 👥 Guia para a Equipe de Desenvolvimento

1. **Novos Módulos do Backend**:
   - Crie submódulos dentro de `apps/server/src/` (ex: `apps/server/src/modules/scheduler/`, `apps/server/src/modules/tasks/`, etc.).
   - O driver PostgreSQL (`pg` e `@types/pg`) já está listado nas dependências.

2. **Novos Componentes e Telas do Frontend**:
   - Crie componentes em `apps/web/src/components/`, páginas em `apps/web/src/pages/`, etc.
   - O Vite já possui proxy configurado para `/api` redirecionar automaticamente para o backend (`http://localhost:3001`).

3. **Contratos e Tipagens Compartilhadas**:
   - Qualquer tipo de dados ou interface compartilhado entre backend e frontend deve ser adicionado em `packages/shared/src/index.ts`.
