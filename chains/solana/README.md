## Dockerfile

The Solana `Dockerfile` ensures the following are installed/compiled ready for running Solana devnet locally with hyperlane programs:

- `hyperlane-sealevel-client` (performs deploys/core operations on Solana, its superceeded by `@hyperlane/cli` but Solana support is still in progress there)
- Precompiled Hyperlane Sealevel programs located at `/sealevel/deploy`
- Pre-downloaded required Solana BPF programs
- Solana tools used for running `solana-test-validator` and other Solana commands

## TODO

"foreignDeployment": "0x8dbeb3391145e00328c58161fdfd296beb1fc8ef760c8c12e912ae6a5393855b"

This field in token-config needs to be known ahead of time

--validators 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 \ # TODO

generate our own validator keypairs
