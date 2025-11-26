#!/bin/bash

solana-test-validator \
  --reset \
  --quiet \
  --ledger /ledger \
  --account E9VrvAdGRvCguN2XgXsgu9PNmMM3vZsU8LSUrM68j8ty /opt/solana/deployer_account.json \
  --bpf-program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA /opt/spl/spl_token.so \
  --bpf-program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb /opt/spl/spl_token_2022.so \
  --bpf-program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL /opt/spl/spl_associated_token_account.so \
  --bpf-program noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV /opt/spl/spl_noop.so

