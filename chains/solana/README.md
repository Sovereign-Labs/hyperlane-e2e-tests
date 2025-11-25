## Dockerfile

The Solana `Dockerfile` ensures the following are installed/compiled ready for running Solana devnet locally with hyperlane programs:

- `hyperlane-sealevel-client` (performs deploys/core operations on Solana, its superceeded by `@hyperlane/cli` but Solana support is still in progress there)
- Precompiled Hyperlane Sealevel programs located at `/sealevel/deploy`
- Pre-downloaded required Solana BPF programs
- Solana tools used for running `solana-test-validator` and other Solana commands
