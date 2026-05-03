# Covenant contracts

Hardhat project for **GuardRailRegistry** and related deploy scripts.

## Setup

```bash
npm install
cp .env.example .env   # PRIVATE_KEY, RPC URLs, etc.
```

## Common tasks

```bash
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network sepolia
```

After deploy, set **`GUARDRAIL_REGISTRY_ADDRESS`** on the Covenant server (see **[`../ENVIRONMENT.md`](../ENVIRONMENT.md)**).

## Ignored artifacts

`artifacts/`, `cache/`, `coverage/`, and local `.env` are gitignored; **`.env.example` stays tracked** as the template.
