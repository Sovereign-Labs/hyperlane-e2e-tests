#!/bin/bash

solana config set --url http://validator:8899

echo "Waiting for solana-test-validator to start..."
until solana cluster-version 2>/dev/null; do
  sleep 1
done
echo "solana-test-validator is ready!"

echo "Deploying hyperlane programs"
hyperlane-sealevel-client \
  --keypair /opt/solana/deployer_keypair.json \
  --compute-budget 200000 \
  core deploy \
  --environment local \
  --environments-dir /opt/sealevel/environments \
  --local-domain 1337 \
  --chain sealevel \
  --built-so-dir /opt/sealevel
echo "Hyperlane core programs deployed"
