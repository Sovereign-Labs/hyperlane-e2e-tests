#!/usr/bin/env bun

import {
  MultiProtocolProvider,
  TokenStandard,
  WarpCore,
  type WarpCoreConfig,
  type ChainMap,
  type ChainMetadata,
} from "@hyperlane-xyz/sdk";
import { chainMetadata as registryChainMetadata } from "@hyperlane-xyz/registry";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { ProtocolType } from "@hyperlane-xyz/utils";
import agentConfig from "../agents/config.json";
import tokenConfig from "../chains/solana/environments/local/warp-routes/sealevel-sovereignsolana/token-config.json";
import deployedWarpRoutes from "../chains/solana/environments/local/warp-routes/sealevel-sovereignsolana/program-ids.json";
import solanaKeypair from "../chains/solana/environments/local/accounts/signer_keypair.json";

interface Account {
  privateKey: Uint8Array;
  publicKey: string;
  address: string;
}

const sovereignAccount: Account = {
  address: "7bWFTGcxY59KfAc5p7SaBaPieQkcSBXs7xCyRoL7vPtf",
  publicKey: "61fcf0f466bc20ca3882d46ae07d65227e31cfaefb852bc8f579415247565dd4",
  privateKey: new Uint8Array([
    39, 195, 119, 77, 82, 231, 30, 162, 102, 169, 197, 37, 108, 217, 139, 154,
    230, 126, 98, 242, 174, 94, 211, 74, 102, 141, 184, 234, 168, 62, 27, 172,
  ]),
};
const solanaAccount: Account = {
  address: "9rAXRptd1YDQjCJJQbF4GaZ9JHaLx93rNfJUDpcvPxXc",
  // solana just uses public key as address
  publicKey: "9rAXRptd1YDQjCJJQbF4GaZ9JHaLx93rNfJUDpcvPxXc",
  privateKey: new Uint8Array([]),
};

const chainMetadata: ChainMap<ChainMetadata> = {
  sealevel: {
    ...agentConfig.chains.sealevel,
    chainId: agentConfig.chains.sealevel.domainId,
    protocol: ProtocolType.Sealevel,
    rpcUrls: [{ http: "http://0.0.0.0:8899" }],
  },
  sovereign: {
    ...agentConfig.chains.sovereign,
    chainId: agentConfig.chains.sovereign.domainId,
    protocol: ProtocolType.Sovereign,
    rpcUrls: [{ http: "http://0.0.0.0:12346" }],
  },
};

const solanaTokenId = deployedWarpRoutes.sealevel.base58;
const sovereignTokenId = deployedWarpRoutes.sovereign.hex;

// Matches `warpRouteConfigs` exported from `@hyperlane-xyz/registry`
// Connections are encoded as `protocol|chainName|addressOrDenom` where addressOrDenom is normally the warp route id
// Solana native token <-> Sovereign (wrapped synthetic token)
const warpCoreConfig: Record<string, WarpCoreConfig> = {
  "sealevel/sovereign": {
    tokens: [
      {
        addressOrDenom: sovereignTokenId,
        chainName: "sovereign",
        collateralAddressOrDenom: tokenConfig.sovereign.token,
        connections: [{ token: `sealevel|sealevel|${solanaTokenId}` }],
        decimals: 9,
        name: "Solana",
        standard: TokenStandard.SovHypSynthetic,
        symbol: "SOL",
      },
      {
        addressOrDenom: solanaTokenId,
        chainName: "sealevel",
        connections: [
          {
            token: `sovereign|sovereign|${sovereignTokenId}`,
          },
        ],
        decimals: 9,
        name: "Solana",
        standard: TokenStandard.SealevelHypNative,
        symbol: "SOL",
      },
    ],
  },
};

const multiProvider = new MultiProtocolProvider(chainMetadata);
const warpCore = WarpCore.FromConfig(
  multiProvider,
  warpCoreConfig["sealevel/sovereign"]
);

const solanaToken = warpCore.findToken("sealevel", solanaTokenId);
console.log("Origin Token:", solanaToken);

if (!solanaToken) {
  throw new Error("Solana token not found in WarpCore");
}

const warpTxns = await warpCore.getTransferRemoteTxs({
  originTokenAmount: solanaToken.amount(1),
  destination: "sovereign",
  sender: solanaAccount.address,
  recipient: sovereignAccount.address,
});

const keypair = Keypair.fromSecretKey(new Uint8Array(solanaKeypair));
const provider = multiProvider.getSolanaWeb3Provider("sealevel");
// const connection = new Connection("http://0.0.0.0:8899", "confirmed");

for (const tx of warpTxns) {
  console.log(`Processing ${tx.category} transaction...`);

  const transaction = tx.transaction as Transaction;

  // Must partial sign otherwise we loose existing signatures
  transaction.partialSign(keypair);

  const signature = await provider.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  const confirmation = await provider.confirmTransaction(
    signature,
    "confirmed"
  );

  if (confirmation.value.err) {
    throw new Error(
      `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
    );
  }

  console.log(`Transaction confirmed: ${signature}`);
}
