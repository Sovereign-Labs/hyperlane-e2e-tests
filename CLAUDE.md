# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hyperlane E2E Tests is an end-to-end testing infrastructure for cross-chain messaging using Hyperlane. It runs two blockchain chains (Solana/Sealevel with domain ID 1337, and Sovereign Rollup with domain ID 5555) with Hyperlane validators and relayers in a Docker environment.

## Common Commands

```bash
# Start all services (chains + agents)
make start

# Start with observability stack (Grafana, Prometheus, Loki, Tempo)
WITH_OBSERVABILITY=1 make start

# Stop all services
make stop

# Clean test data (required before fresh start)
make clean

# Full reset
make clean start
```

## Service Endpoints (when running)

- Solana RPC: http://localhost:8899
- Sovereign Rollup RPC: http://localhost:12346
- Sovereign Swagger UI: http://localhost:12346/swagger-ui
- Hyperlane Relayer metrics: http://localhost:9091/metrics
- Hyperlane Validator (Solana) metrics: http://localhost:9092/metrics
- Hyperlane Validator (Sovereign) metrics: http://localhost:9093/metrics
- Grafana (if observability enabled): http://localhost:3000 (admin/admin123)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Docker Compose Environment                │
├─────────────────────────────────────────────────────────────┤
│  chains/solana/           │  chains/sovereign-solana/       │
│  - Solana test validator  │  - Sovereign SDK rollup (Rust)  │
│  - Hyperlane programs     │  - Mock DA layer                │
│  - Domain ID: 1337        │  - Domain ID: 5555              │
├─────────────────────────────────────────────────────────────┤
│                     agents/                                  │
│  - Relayer (routes messages between chains)                 │
│  - Validator for Sealevel (signs checkpoints)               │
│  - Validator for Sovereign (signs checkpoints)              │
├─────────────────────────────────────────────────────────────┤
│           tools/sov-observability/ (optional)               │
│  Grafana, Prometheus, Loki, Tempo, InfluxDB, Telegraf       │
└─────────────────────────────────────────────────────────────┘
```

## Key Directories

- `chains/solana/` - Solana validator with Hyperlane programs, init.sh deploys contracts
- `chains/sovereign-solana/` - Sovereign rollup implementation
  - `rollup/crates/rollup/` - Main rollup binary
  - `rollup/crates/stf/` - State Transition Function with Hyperlane module
  - `index.ts` - TypeScript initialization for warp routes and IGP
- `agents/` - Hyperlane relayer and validator configurations
  - `config.json` - Chain definitions, RPC endpoints, program addresses
- `tools/sov-observability/` - Monitoring stack with its own Makefile
- `registry/chains/metadata.yaml` - Chain domain IDs and metadata

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Sovereign Rollup | Rust (Sovereign SDK), Cargo workspace |
| Solana Chain | solana-test-validator with Hyperlane Anchor programs |
| Initialization | Bun + TypeScript (chains/sovereign-solana/) |
| Orchestration | Docker Compose |
| Observability | Grafana, Prometheus, Loki, Tempo |

## Working with the Sovereign Rollup

The rollup is a Cargo workspace in `chains/sovereign-solana/rollup/`:

```bash
cd chains/sovereign-solana/rollup

# Build the rollup
cargo build

# Build release
cargo build --release

# Workspace members: rollup, stf, value-setter example, acceptance-test, soak-test
```

Rust toolchain: 1.88+ (see rust-toolchain.toml)

## Working with Initialization Scripts

TypeScript initialization in `chains/sovereign-solana/`:

```bash
cd chains/sovereign-solana
bun install
bun run index.ts  # Registers warp routes and configures IGP
```

## Agent Configuration

`agents/config.json` contains chain definitions including:
- RPC URLs (internal Docker hostnames)
- Mailbox and program addresses
- Signer configurations

Validators use different private keys specified in docker-compose environment variables.

## Health Checks

Services have built-in Docker health checks:
- Solana: `solana cluster-version -u localhost`
- Sovereign: `curl http://0.0.0.0:12346/healthcheck`

## Test Data Locations

- `chains/sovereign-solana/rollup/test-data/docker` - Sovereign rollup state
- `agents/docker-data/` - Validator signatures and databases

Both are removed by `make clean`.
