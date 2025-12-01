#!/bin/bash

set -e

solana config set --url http://solana_validator:8899

keypair="/opt/sealevel/environments/local/accounts/deployer_keypair.json"
cli="hyperlane-sealevel-client --keypair $keypair"
base_dir="/opt/sealevel"
env_name="local"
base_env_dir="$base_dir/environments"
env_dir="$base_dir/environments/$env_name"
registry="/opt/registry"
chain="sealevel"
domain=1337

echo "Deploying hyperlane programs"
$cli \
  --compute-budget 200000 \
  core deploy \
  --environment $env_name \
  --environments-dir $base_env_dir \
  --local-domain $domain \
  --chain $chain \
  --built-so-dir $base_dir
echo "Hyperlane core programs deployed"

echo "Deploying hyperlane-solana-register program"
solana program deploy \
  --keypair $keypair \
  --program-id $env_dir/accounts/hyperlane_solana_sovereign_register-keypair.json \
  /opt/hyperlane-solana-register/hyperlane_solana_sovereign_register.so

echo "hyperlane-solana-register program deployed"

echo "Configuring IGP"

$cli \
  igp configure \
  --gas-oracle-config-file $env_dir/gas-oracle-config.json \
  --registry $registry \
  --program-id GJJLh34havgS9u8YQ6DW3BrCBuYwDGRaa9XtieAgFR6C \
  --chain $chain

echo "IGP configured"

echo "Deploying warp route"
$cli \
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

$cli \
  multisig-ism-message-id \
  set-validators-and-threshold \
  --domain 5555 \
  --validators 0xc0E05d5b970FcCF6000001B373bE6D66D7f0E36F \
  --threshold 1 \
  --program-id Yvvy7bXg7kVdTL3TMxUynMPat4hDviQbRtAC8TCPnZt

echo "Multisig ISM configured"
