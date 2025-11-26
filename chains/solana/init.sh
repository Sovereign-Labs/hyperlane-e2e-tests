#!/bin/bash

solana config set --url http://validator:8899

echo "Waiting for solana-test-validator to start..."
until solana cluster-version 2>/dev/null; do
  sleep 1
done
echo "solana-test-validator is ready!"

base_dir="/opt/sealevel"
env_name="local"
base_env_dir="$base_dir/environments"
env_dir="$base_dir/environments/$env_name"
registry="/opt/registry"
chain="sealevel"
domain=1337

echo "Deploying hyperlane programs"
hyperlane-sealevel-client \
  --keypair /opt/solana/deployer_keypair.json \
  --compute-budget 200000 \
  core deploy \
  --environment $env_name \
  --environments-dir $base_env_dir \
  --local-domain $domain \
  --chain $chain \
  --built-so-dir $base_dir
echo "Hyperlane core programs deployed"

echo "Configuring IGP"

hyperlane-sealevel-client \
  --keypair /opt/solana/deployer_keypair.json \
  igp configure \
  --gas-oracle-config-file $env_dir/gas-oracle-config.json \
  --registry $registry \
  --program-id GJJLh34havgS9u8YQ6DW3BrCBuYwDGRaa9XtieAgFR6C \
  --chain $chain

echo "IGP configured"

echo "Deploying warp route"
hyperlane-sealevel-client \
  --keypair /opt/solana/deployer_keypair.json \
  --compute-budget 200000 \
  warp-route deploy \
  --environment $env_name \
  --environments-dir $base_env_dir \
  --built-so-dir $base_dir \
  --warp-route-name sealevel-sovereignsolana \
  --token-config-file $env_dir/warp-routes/sealevel-sovereignsolana/token-config.json \
  --registry $registry \
  --ata-payer-funding-amount 1000000000

echo "Warp route deployed"

echo "Configuring multisig ISM"

hyperlane-sealevel-client \
  --keypair /opt/solana/deployer_keypair.json \
  multisig-ism-message-id \
  set-validators-and-threshold \
  --domain 5555 \
  --validators 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 \
  --threshold 1 \
  --program-id Yvvy7bXg7kVdTL3TMxUynMPat4hDviQbRtAC8TCPnZt

echo "Multisig ISM configured"
